const assert = require('assert');
const reflect = require('../../lib/util/reflect');

describe('reflect', () => {
  describe('getFunctionParamNames', () => {
    // eslint-disable-next-line no-unused-vars
    function test1(a, b, c) {}
    // eslint-disable-next-line no-unused-vars
    function test3(a/* a comment */, b, /* another comment */c) {}

    it('it should resolve the correct function parameters', async () => {
      assert.deepEqual(reflect.getFunctionParamNames(test1), ['a', 'b', 'c']);
      assert.deepEqual(reflect.getFunctionParamNames(test3), ['a', 'b', 'c']);
    });
  });
});
