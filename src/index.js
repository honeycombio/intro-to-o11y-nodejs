require("dotenv").config();
const tracer = require("./tracing")(); // turn on tracing

const express = require("express");
const http = require("http");
const { SpanStatusCode, defaultTextMapSetter, context } = require("@opentelemetry/api");
const { W3CTraceContextPropagator } = require("@opentelemetry/core");
const path = require("path");
const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/views/index.html"));
});
app.get("/favicon.png", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/pathetic-spiral-icon.png"));
});
app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/styles.css"));
});
app.get("/sequence.js", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/views/sequence.js"));
});

app.get("/fib", respondToFib(tracer, context.active()));

function respondToFib(tracer, context) {
  return async (req, res) => {
    const span = tracer.startActiveSpan("GET /fib", context, async (span) => {
      let index = parseInt(req.query.index);
      span.setAttribute("app.seqofnum.parameter.index", index);

      let returnValue = 0;
      if (index === 0) {
        returnValue = 0;
      } else if (index === 1) {
        returnValue = 1;
      } else {
        let minusOneResponse = await makeRequest(tracer, context,
          `http://127.0.0.1:3000/fib?index=${index - 1}`
        );
        let minusOneParsedResponse = JSON.parse(minusOneResponse);
        let minusTwoReturn = JSON.parse(await makeRequest(tracer, context,
          `http://127.0.0.1:3000/fib?index=${index - 2}`
        ));
        returnValue = calculateFibonacciNumber(minusOneParsedResponse.fibonacciNumber,
          minusTwoReturn.fibonacciNumber);
      }
      const returnObject = { fibonacciNumber: returnValue, index: index }
      // maybe add the return value as a custom attribute too?
      span.setStatus({ code: SpanStatusCode.OK })
      span.end();
      res.send(JSON.stringify(returnObject));
    });
  }
}

function calculateFibonacciNumber(previous, oneBeforeThat) {
  // can you wrap this next line in a custom span?
  const result = previous + oneBeforeThat;
  return previous + oneBeforeThat;
}

function makeRequest(tracer, context, url) {
  console.log("Before the active span, context is: " + JSON.stringify(context));
  return tracer.startActiveSpan("GET", context, async (span) => {
    console.log("In makeRequest, the context is: " + JSON.stringify(context));
    return new Promise((resolve, reject) => {
      let data = "";
      const headersWithTraceContext = new W3CTraceContextPropagator().inject(context, {}, defaultTextMapSetter)
      http.get(url, { headers: headersWithTraceContext }, res => {
        res.on("data", chunk => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
        res.on("error", err => {
          reject(err);
        });
      })
    }).then(
      (out) => { span.setStatus({ code: SpanStatusCode.OK }); span.end(); return out; },
      (err) => {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err?.message,
        });
        span.end();
      });
  });
}

app.listen(process.env.PORT || 3000, () =>
  console.log("Listening on port 3000. Try: http://localhost:3000/")
);
