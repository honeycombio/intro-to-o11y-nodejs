const express = require("express");
const http = require("http");
const otel = require("@opentelemetry/api");
const path = require("path");
const app = express();

const port_number = 3001; // I'd rather use 3000 but Apple did something in Big Sur that keeps that port busy

// Uncomment this to create new spans yourself!
//
// const tracer = otel.trace.getTracer(
//  "custom tracing"
// );

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

app.get("/fib", async (req, res) => {
  const index = parseInt(req.query.index);

  // uncomment 2 lines to add a custom attribute:
  // const span = otel.trace.getActiveSpan();
  // span.setAttribute("parameter.index", index);


  let returnValue = 0;
  if (index === 0) {
    returnValue = 0;
  } else if (index === 1) {
    returnValue = 1;
  } else {
    let minusOneResponse = await makeRequest(
      `http://127.0.0.1:${port_number}/fib?index=${index - 1}`
    );
    let minusOneParsedResponse = JSON.parse(minusOneResponse);
    let minusTwoReturn = JSON.parse(await makeRequest(
      `http://127.0.0.1:${port_number}/fib?index=${index - 2}`
    ));
    returnValue = calculateFibonacciNumber(minusOneParsedResponse.fibonacciNumber,
      minusTwoReturn.fibonacciNumber);
  }

  // span.setAttribute("app.seqofnum.result.fibonacciNumber", returnValue);
  const returnObject = { fibonacciNumber: returnValue, index: index }
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

app.listen(process.env.PORT || port_number, () =>
  console.log(`Listening on port_number ${port_number}. Try: http://localhost:${port_number}/`)
);
