const { DiagConsoleLogger, DiagLogLevel, diag } = require("@opentelemetry/api");
//diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// import otel dependencies
const opentelemetry = require("@opentelemetry/api");
const { ConsoleLogger, W3CTraceContextPropagator } = require("@opentelemetry/core");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
  BatchSpanProcessor
} = require("@opentelemetry/sdk-trace-base");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const {
  ExpressInstrumentation
} = require("@opentelemetry/instrumentation-express");
const { OTLPTraceExporter } =  require('@opentelemetry/exporter-otlp-grpc');
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const grpc = require("@opentelemetry/exporter-otlp-grpc/node_modules/@grpc/grpc-js");
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

module.exports = () => {
  // set log level to DEBUG for a lot of output
 // opentelemetry.diag.setLogger(new opentelemetry.DiagConsoleLogger(), opentelemetry.DiagLogLevel.WARN);

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
      new OTLPTraceExporter({
        url: "grpc://api.honeycomb.io:443/",
        credentials: creds,
        metadata
      })
    )
  );

  // uncomment this to see traces in the log
  // provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  /*
   If you run this app on your own machine, you don't need this special handling.
     
   This part exists because Glitch is a Honeycomb customer,
   and if we don't treat these specially, our traces become children
   of Glitch's traces!
   Incoming requests have Glitch's tracing context AND information about the request forwarding.
   So we notice the forwarding headers, and then ignore the tracing headers.
   */
  const w3c = new W3CTraceContextPropagator();
  const distrustRemotePropagator = {
    // use the standard method to put headers in outgoing HTTP calls (inject)
    inject: w3c.inject, 
    // but a special way to pull traceID out of the headers of incoming HTTP calls (extract)
    extract(context, carrier, getter) { 
      // if an 'x-forwarded-for' header exists, then Glitch sent us this, with its trace headers that we don't want
      const xff = getter.get(carrier, "x-forwarded-for");
      if (!xff) {
        // header absent: use the standard extraction mechanism
        return w3c.extract(context, carrier, getter);
      } else {
        // header present: do not extract any trace information from the headers. Return the unmodified context
        return context;
      }
    },
    fields() {
      // describes the header fields that this context propagator cares about
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
