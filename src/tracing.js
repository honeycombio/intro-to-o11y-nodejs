// tracing.js
"use strict";

// import otel dependencies
const opentelemetry = require("@opentelemetry/api");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
  BatchSpanProcessor,
} = require("@opentelemetry/sdk-trace-base");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const {
  ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const {
  SEMRESATTRS_SERVICE_NAME,
} = require("@opentelemetry/semantic-conventions");
const { Resource } = require("@opentelemetry/resources");

// TROUBLESHOOTING: tell it to log.
// set log level to DEBUG for a lot of output, but I like INFO.
// setting this to INFO means you'll see connection errors
opentelemetry.diag.setLogger(
  new opentelemetry.DiagConsoleLogger(),
  opentelemetry.DiagLogLevel.INFO
);

const apikey = process.env.HONEYCOMB_API_KEY;
// TROUBLESHOOTING: HTTP is more likely to work, so try this first, then change to GRPC to optimize
const sendToHoneycombOverHttp = new OTLPTraceExporter({
  url: "https://api.honeycomb.io:443/v1/traces",
  headers: {
    "x-honeycomb-team": apikey,
  }
});

// TROUBLESHOOTING: add this span processor to see that the spans are being created. It's a lot of output, so never use in prod
const sendToStdout = new SimpleSpanProcessor(new ConsoleSpanExporter());

const sendBatchesToHoneycomb = new BatchSpanProcessor(sendToHoneycombOverHttp,
  // TROUBLESHOOTING: scheduledDelayMillis tells it to send a little sooner.
  //  the queue size and export size is only for this demo app, which sends too many spans. You don't need this
  {
    scheduledDelayMillis: 500,
    maxQueueSize: 16000,
    maxExportBatchSize: 1000,
  });

const sdk = new NodeSDK({
  resource: new Resource({
    // TROUBLESHOOTING: make sure the service name is a known value; then delete this config to use OTEL_SERVICE_NAME
    [SEMRESATTRS_SERVICE_NAME]: "sequence-of-numbers-nodejs",
  }),
  spanProcessors: [
    sendBatchesToHoneycomb,
    sendToStdout
  ],
  // TROUBLESHOOTING: I like to be explicit about instrumentation. This also happens to be more efficient
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()], 
});

sdk.start();

// TROUBLESHOOTING: this printout is handy locally.
// If you want to check where your api key is sending, I made this: https://honeycomb-whoami.glitch.me
const serviceName = process.env.OTEL_SERVICE_NAME || "unknown_service";
console.log(
  `Exporting to Honeycomb with APIKEY <${apikey}> and service name ${serviceName}`
);
