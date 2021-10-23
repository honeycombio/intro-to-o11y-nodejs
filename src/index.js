const tracer = require("./tracing")(); // turn on tracing

const otel = require("@opentelemetry/api"); // get access to the current span

const express = require("express");
const http = require("http");
const path = require("path");
const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/views/index.html"));
});
app.get("/sequence.js", (req, res) => {
  res.sendFile(path.join(__dirname, "/../static/views/sequence.js"));
});

app.get("/fib", async (req, res) => {
  let index = parseInt(req.query.index);

  // populate a custom attribute on the current span
  // const span = otel.trace.getSpan(otel.context.active());
  // span.setAttribute("parameter.index", index);

  let returnValue = 0;
  if (index === 0) {
    returnValue = 0;
  } else if (index === 1) {
    returnValue = 1;
  } else {
    let minusOneResponse = await makeRequest(
      `http://127.0.0.1:3000/fib?index=${index - 1}`
    );
    let minusOneParsedResponse = JSON.parse(minusOneResponse);
    let minusTwoReturn = JSON.parse(await makeRequest(
      `http://127.0.0.1:3000/fib?index=${index - 2}`
    ));
    // let span = tracer.startSpan("calculation");
    returnValue = calculateFibonacciNumber(minusOneParsedResponse.fibonacciNumber,
                                           minusTwoReturn.fibonacciNumber);
    // span.end();
  }
  const returnObject = { fibonacciNumber: returnValue, index: index }
  // maybe add the return value as a custom attribute too?
  res.send(JSON.stringify(returnObject));
});

function calculateFibonacciNumber(previous, oneBeforeThat) {
 // can you wrap this next line in a custom span?
  const result = previous + oneBeforeThat;
  return previous + oneBeforeThat;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    let data = "";
    http.get(url, res => {
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
      res.on("error", err => {
        reject(err);
      });
    });
  });
}

app.listen(process.env.PORT || 3000, () =>
  console.log("Listening to port 3000")
);
