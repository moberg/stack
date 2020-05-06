const assert = require('assert');
const { App } = require('../lib/model/app/App');
const Container = require('../lib/model/Container');

describe('App', () => {
  describe('#constructor()', () => {
    let app = null;

    beforeEach(() => {
      const container = new Container({
        name: 'testContainer',
        // eslint-disable-next-line no-template-curly-in-string
        dockerFile: 'this is the dockerfile with ${a} variable',
      });

      const stack = {
        name: 'unit-test',
        dockerRegistry: 'fakeRegistry',
      };

      const resolver = { containers: {}, infrastructure: {}, apps: {} };
      const config = {
        name: 'test-app',
        port: 9875,

        container,
        stack,
        resolver,
      };

      app = new App(config);
    });

    it('it should have the config parameters set', async () => {
      assert.equal(app.name, 'test-app');
      assert.equal(app.port, 9875);
      assert.equal(app.container.name, 'testContainer');
    });
  });
});
