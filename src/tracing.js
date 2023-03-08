// tracing.js
"use strict";

/**
 * This implementation deliberately uses a harder initialization
 * process, in order to show more of what's happening, plus how the
 * configuration is customized here to send more spans (as the app
 * deliberately sends an unreasonable number).
 * 
 * There's an easier way to configure it.
 * The rest of this file could be replaced with these lines:
 * 
const { HoneycombSDK } = require('@honeycombio/opentelemetry-node');
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');

// uses HONEYCOMB_API_KEY and OTEL_SERVICE_NAME environment variables
const sdk = new HoneycombSDK({
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
 */

const { DiagConsoleLogger, DiagLogLevel, diag } = require("@opentelemetry/api");

// import otel dependencies
const opentelemetry = require("@opentelemetry/api");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { ConsoleLogger } = require("@opentelemetry/core");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
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
} = require("@opentelemetry/exporter-trace-otlp-grpc");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const grpc = require("@grpc/grpc-js");
const { Resource } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");

// set log level to DEBUG for a lot of output
// setting this to INFO means you'll see connection errors
opentelemetry.diag.setLogger(
  new opentelemetry.DiagConsoleLogger(),
  opentelemetry.DiagLogLevel.INFO
);

// set up gRPC. This is faster at runtime; HTTP is easier to setup

const apikey = process.env.HONEYCOMB_API_KEY;
const metadata = new grpc.Metadata();
metadata.set("x-honeycomb-team", apikey);
const sendToHoneycombOverGrpc = new OTLPTraceExporter({
  url: "grpc://api.honeycomb.io:443/",
  credentials: grpc.credentials.createSsl(),
  metadata,
});

const sendBatchesToHoneycomb = new BatchSpanProcessor(sendToHoneycombOverGrpc, {
  scheduledDelayMillis: 500,
  maxQueueSize: 16000,
  maxExportBatchSize: 1000,
});

const sdk = new NodeSDK({
  spanProcessor: sendBatchesToHoneycomb,
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});

sdk.start();

const serviceName = process.env.OTEL_SERVICE_NAME || "unknown_service";
console.log(
  `Exporting to Honeycomb with APIKEY <${apikey}> and service name ${serviceName}`
);
