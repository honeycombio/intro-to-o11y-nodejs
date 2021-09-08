require('dotenv').config();
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
  let initialValue = parseInt(req.query.index);

  // populate a custom attribute on the current span
  const span = otel.trace.getSpan(otel.context.active());
  span.setAttribute("parameter.index", initialValue);

  let returnValue = 0;
  if (initialValue === 0) {
    returnValue = 0;
  } else if (initialValue === 1) {
    returnValue = 1;
  } else {
    let minusOneReturn = await makeRequest(
      `http://127.0.0.1:3000/fib?index=${initialValue - 1}`
    );
    let minusTwoReturn = await makeRequest(
      `http://127.0.0.1:3000/fib?index=${initialValue - 2}`
    );
    returnValue = calculateFibonacciNumber(minusOneReturn, minusTwoReturn);
  }
  // maybe add the return value as a custom attribute too?
  res.send(returnValue.toString());
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
        resolve(parseInt(data));
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
