require("dotenv").config();
const tracer = require("./tracing")(); // turn on tracing

const express = require("express");
const http = require("http");
const opentelemetry = require("@opentelemetry/api");
const { W3CTraceContextPropagator } = require("@opentelemetry/core");
const { getSpan } = require("@opentelemetry/api/build/src/trace/context-utils");
const path = require("path");
const app = express();
const { SpanStatusCode, defaultTextMapGetter, defaultTextMapSetter } = opentelemetry;
const contextAPI = opentelemetry.context;

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

app.get("/fib", respondToFib(tracer));

function respondToFib(tracer) {
  return async (req, res) => {
    const parentTraceContext = TraceContext.fromHeaders(req.headers, tracer);
    parentTraceContext.inSpan("GET /fib", async (span, traceContext) => {

      let index = parseInt(req.query.index);
      span.setAttribute("app.seqofnum.parameter.index", index);

      let returnValue = 0;
      if (index === 0) {
        returnValue = 0;
      } else if (index === 1) {
        returnValue = 1;
      } else {
        returnValue = await sumPreviousTwoFibonacciNumbers(traceContext, index);
      }
      const returnObject = { fibonacciNumber: returnValue, index: index }
      // maybe add the return value as a custom attribute too?
      span.setStatus({ code: SpanStatusCode.OK })
      span.end();
      res.send(JSON.stringify(returnObject));
    });
  }
}

async function sumPreviousTwoFibonacciNumbers(traceContext, index) {
  try {
    let minusOneResponse = await makeRequest(traceContext,
      `http://127.0.0.1:3000/fib?index=${index - 1}`
    );
    let minusOneParsedResponse = JSON.parse(minusOneResponse);
    let minusTwoReturn = JSON.parse(await makeRequest(traceContext,
      `http://127.0.0.1:3000/fib?index=${index - 2}`
    ));

    return calculateFibonacciNumber(minusOneParsedResponse.fibonacciNumber,
      minusTwoReturn.fibonacciNumber);
  } catch (err) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message,
    });
    span.end();
    res.status(500);
    res.send("failure");
    throw err;
  }
}

function calculateFibonacciNumber(previous, oneBeforeThat) {
  // can you wrap this next line in a custom span?
  const result = previous + oneBeforeThat;
  return previous + oneBeforeThat;
}

class TraceContext {
  constructor(f) {
    this.tracer = tracer;
  }

  static fromHeaders(headers, tracer) {
    new W3CTraceContextPropagator().extract(contextAPI.active(), headers, defaultTextMapGetter);
    return new TraceContext(tracer);
  }

  /* [Span, TraceContext] */ startSpan(name) {
    return [this.tracer.startActiveSpan(name, s => s), this];
  }

  getPropagationHeaders() {
    const headers = {};
    new W3CTraceContextPropagator().inject(contextAPI.active(), headers, defaultTextMapSetter);
    return headers;
  }

  inSpan(name, fn) {
    tracer.startActiveSpan(name, (span) => fn(span, this));
  }
}


function makeRequest(parentTraceContext, url) {

  const [span, traceContext] = parentTraceContext.startSpan("GET");
  return new Promise((resolve, reject) => {
    let data = "";
    const headers = traceContext.getPropagationHeaders();
    console.log("Headers with context: ", headers);
    span.setAttribute("headers", JSON.stringify(headers));
    http.get(url, { headers: headers }, res => {
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
    (out) => {
      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttribute("app.result", out);
      span.end();
      return out;
    },
    (err) => {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err?.message,
      });
      span.end();
      throw err;
    });
}

app.listen(process.env.PORT || 3000, () =>
  console.log("Listening on port 3000. Try: http://localhost:3000/")
);
