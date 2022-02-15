const opentelemetry = require("@opentelemetry/api");

const tracer = opentelemetry.trace.getTracer("baby cache")

class BabyCache {
  constructor() {
    this.cache = [];
  }
  get(key) {
    const span = tracer.startSpan("fetch from cache");
    span.setAttribute("app.seqofnum.cache.size", this.size());
    span.setAttribute("app.seqofnum.cache.key", key);
    const result = this.cache[key];
    span.end();
    return result;
  }
  set(key, value) {
    const span = tracer.startSpan("insert into cache");
    span.setAttribute("app.seqofnum.cache.key", key);
    this.cache[key] = value;
    span.setAttribute("app.seqofnum.cache.size", this.size());
    span.end();
  }
  has(key) {
    const span = tracer.startSpan("check cache");
    span.setAttribute("app.seqofnum.cache.size", this.size());
    span.setAttribute("app.seqofnum.cache.key", key);
    const result = this.cache[key] !== undefined
    span.setAttribute("app.seqofnum.cache.hit", result);
    span.end();
    return result;
  }
  size(key) {
    return Object.keys(this.cache).length;
  }
  clear() {
    const span = tracer.startSpan("clear cache");
    span.setAttribute("app.seqofnum.cache.previous_size", this.size());
    this.cache = [];
    span.setAttribute("app.seqofnum.cache.size", this.size());
    span.end();
  }
};

module.exports = BabyCache
