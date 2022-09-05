const { DiagConsoleLogger, DiagLogLevel, diag } = require("@opentelemetry/api");
//diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// import otel dependencies
const opentelemetry = require("@opentelemetry/api");
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

module.exports = () => {
  // If you're having trouble getting tracing to work, then set log level to DEBUG for a lot of output
  opentelemetry.diag.setLogger(
    new opentelemetry.DiagConsoleLogger(),
    opentelemetry.DiagLogLevel.INFO
  );

  const serviceName = process.env.OTEL_SERVICE_NAME || "sequence-of-numbers";
  console.log("Sending traces as service: " + serviceName)

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });
  
  // uncomment this to see traces in stdout
  //provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  sendToHoneycomb(provider);
  sendToJaeger(provider);

  provider.register();

  // turn on autoinstrumentation for traces you're likely to want
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });

  process.on("SIGINT", async () => {
    console.log("Flushing telemetry");
    await provider.activeSpanProcessor.forceFlush();
    console.log("Flushed");
    process.exit();
  });

  const tracer = opentelemetry.trace.getTracer(
    "sequence-of-numbers"
  );

  return tracer;
};

function sendToJaeger(provider) {

  const jaegerLocation = process.env["JAEGER_LOCATION"]
  console.log(
    `Exporting to Jaeger at <${jaegerLocation}>`
  );
  
  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: `http://${jaegerLocation}:4317`,
        credentials: grpc.credentials.createInsecure(),
      }),
      // override the defaults; spend more network and memory on telemetry
      {
        scheduledDelayMillis: 500,
        maxQueueSize: 16000,
        maxExportBatchSize: 1000,
      }
    )
  );
}

function sendToHoneycomb(provider) {

  const apikey = process.env.HONEYCOMB_API_KEY;
  console.log(
    `Exporting to Honeycomb with APIKEY <${apikey}>`
  );
  
  const metadata = new grpc.Metadata();
  metadata.set("x-honeycomb-team", apikey);

  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: "https://api.honeycomb.io:443/",
        credentials: grpc.credentials.createSsl(),
        metadata,
      }),
      // override the defaults; spend more network and memory on telemetry
      {
        scheduledDelayMillis: 500,
        maxQueueSize: 16000,
        maxExportBatchSize: 1000,
      }
    )
  );
}
