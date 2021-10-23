# Intro to Observability: Demo in Node.js

This Node.js application is here for you to try out tracing.
It consists of a microservice that calls itself,
so you can simulate a whole microservice ecosystem with just one service!

Spoiler: this microservice implements the <a href="https://en.wikipedia.org/wiki/Fibonacci_number">Fibonacci sequence</a>.

## What to do

Remix this app in Glitch so that you can edit it.

On the home page, click "Go" to see a sequence of numbers appear gradually.
Maybe open the browser tools and notice how long each request takes.
Why does it get slower and slower?

Let's add tracing and find out!

### Autoinstrument

This project has the tracing configuration set up in tracing.js.
See that the top line of `index.js` calls into `tracing.js` to activate this.

Notice that in `tracing.js`, the code refers to some environment variables.

Set those up in `.env`:

```
HONEYCOMB_API_KEY=replace-this-with-a-real-api-key
HONEYCOMB_DATASET=otel-nodejs
SERVICE_NAME=fibonacci-microservice
```

Get a Honeycomb API Key from your Team Settings in [Honeycomb](https://ui.honeycomb.io). (find this by clicking on your profile in the lower-left corner.)

You can name the Honeycomb Dataset anything you want.

You can choose any Service Name you want.

Glitch will automatically restart the app. Click "Go" to get the sequence of
numbers again, and head over to [Honeycomb](https://ui.honeycomb.io) for your data.

How many traces do you see?

Which ones took the longest?

What was the 'index' query parameter in the slowest trace?

### Add a custom field

Let's make it easier to find that 'index' query parameter.

When we receive the request to `/fib`, we know that index is interesting data,
so add a field.

To get access to the current span, first import the OpenTelemetry API at the
top of `index.js` (this should be there already):

`const otel = require("@opentelemetry/api");`

Then, anywhere in that file, you can grab the current span and add attributes.
Find these lines commented out in the request handler, and uncomment them:

```js
const span = otel.trace.getSpan(otel.context.active());
span.setAttribute("parameter.index", index);
```

Test the app again, look at the traces, and find the new field you added.

### Add a custom span

How long does the real calculation take?

At the beginning of the `calculateFibonacciNumber` function, create a custom span (or find this line and uncomment it)

`let span = tracer.startSpan("calculation");`

and then after the very exciting calculation, end it:

`span.end();`

Now see if you can spot the portion of your traces used for the real math!
