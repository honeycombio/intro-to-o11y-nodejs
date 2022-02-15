const BabyCache = require("../src/cache.js");
const assert = require("assert");

describe("baby cache", () => {
  it("starts out empty", () => {
    const subject = new BabyCache();
    assert.strictEqual(subject.size(), 0);
    assert.strictEqual(subject.has("anything"), false);
  });

  it("can hold a value", () => {
    const subject = new BabyCache();
    const key = 0;
    const value = "yes";
    subject.set(key, value);
    assert.strictEqual(subject.has(key), true);
    assert.strictEqual(subject.get(key), value);
    assert.strictEqual(subject.size(), 1);
  })
});
