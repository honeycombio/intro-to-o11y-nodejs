const { DiagConsoleLogger, DiagLogLevel, diag } = require("@opentelemetry/api");
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// import otel dependencies
const opentelemetry = require("@opentelemetry/api");
const { ConsoleLogger, HttpTraceContextPropagator } = require("@opentelemetry/core");
const { NodeTracerProvider } = require("@opentelemetry/node");
const {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
  BatchSpanProcessor
} = require("@opentelemetry/tracing");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const {
  ExpressInstrumentation
} = require("@opentelemetry/instrumentation-express");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const grpc = require("@opentelemetry/exporter-collector-grpc/node_modules/@grpc/grpc-js");
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');


const {
  CollectorTraceExporter
} = require("@opentelemetry/exporter-collector-grpc");

module.exports = () => {
  // set up exporter options
  // opentelemetry.diag.setLogger(new opentelemetry.DiagConsoleLogger(), opentelemetry.DiagLogLevel.DEBUG);

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'fibonacci-microservice',
    }),
  });

  const metadata = new grpc.Metadata();
  // console.log("Setting API key to " + process.env.HONEYCOMB_API_KEY)
  metadata.set("x-honeycomb-team", process.env.HONEYCOMB_API_KEY);
  metadata.set(
    "x-honeycomb-dataset",
    process.env.HONEYCOMB_DATASET || "otel-nodejs"
  );
  const creds = grpc.credentials.createSsl();
  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new CollectorTraceExporter({
        url: "grpcs://api.honeycomb.io:443/",
        credentials: creds,
        metadata
      })
    )
  );

  // uncomment this to see traces in the log
  //provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  /*
   This part exists because Glitch is a Honeycomb customer,
   and if we don't treat these specially, our traces become children
   of Glitch's trace's!
   If you run this app on your own machine, you don't need this special handling.
   */
  const w3c = new HttpTraceContextPropagator();
  const distrustRemotePropagator = {
    inject: w3c.inject,
    extract(context, carrier, getter) {
      const xff = getter.get(carrier, "x-forwarded-for");
      if (!xff) {
        return w3c.extract(context, carrier, getter);
      }
      return context;
    },
    fields() {
      return [...w3c.fields(), "x-forwarded-for"];
    }
  };
  provider.register({
    propagator: distrustRemotePropagator
  });
  /*
  end special handling for Glitch
  */

  // turn on autoinstrumentation for traces you're likely to want
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()]
  });

  return opentelemetry.trace.getTracer(
    process.env.SERVICE_NAME || "fibonacci-microservice"
  );
};
