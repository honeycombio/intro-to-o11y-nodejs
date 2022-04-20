class GoodEnoughCache {
  constructor() {
    this.cache = [];
  }
  get(key) {
    const result = this.cache[key];
    return result;
  }
  set(key, value) {
    this.cache[key] = value;
  }
  has(key) {
    const result = this.cache[key] !== undefined
    return result;
  }
  size(key) {
    return Object.keys(this.cache).length;
  }
  clear() {
    this.cache = [];
  }
};

module.exports = GoodEnoughCache
