const assert = require('assert');
const GenerateDockerConfig = require('../../lib/commands/GenerateDockerConfig');
const { mockStack } = require('../mocks');

const getVersionMock = () => ({ dockerImage: 'docker-image', version: 'the-version' });
const getDockerImageMock = () => ({ dockerImage: 'docker-image', version: 'the-version' });
const writeDockerFileMock = () => ({ dockerFile: 'dockerfile', hash: 'the-hash' });

describe('GenerateDockerConfig', () => {
  describe('run()', async () => {
    let cmd = null;
    let app = null;

    beforeEach(async () => {
      const stack = mockStack('mockstack', []);
      // eslint-disable-next-line prefer-destructuring
      app = stack._apps[0];

      cmd = new GenerateDockerConfig(getVersionMock, getDockerImageMock, writeDockerFileMock);
    });

    it('should generate correct output for local registry', async () => {
      const output = await cmd.run(app, { stack: { registry: 'local', region: 'use1' } });

      assert.equal(output.dockerImage, 'docker-image');
      assert.equal(output.version, 'the-version');
      assert.equal(output.region, 'use1');
      assert.equal(output.dockerHost, 'localhost:1234/');
      assert.equal(output.localDockerHost, 'localhost:1234/');
    });

    it('should generate correct output for remote registry in use1', async () => {
      const output = await cmd.run(app, { stack: { registry: 'remote', region: 'use1' } });

      assert.equal(output.dockerImage, 'docker-image');
      assert.equal(output.version, 'the-version');
      assert.equal(output.region, 'use1');
      assert.equal(output.dockerHost, 'use1-host:1234/');
      assert.equal(output.localDockerHost, 'localhost:1234/');
      assert.equal(output.remoteDockerHosts[0], 'use1-host:1234/');
      assert.equal(output.remoteDockerUrls[0], 'https://use1-host:1234/');
    });

    it('should generate correct output for remote registry in euw1', async () => {
      const output = await cmd.run(app, { stack: { registry: 'remote', region: 'euw2' } });

      assert.equal(output.dockerImage, 'docker-image');
      assert.equal(output.version, 'the-version');
      assert.equal(output.region, 'euw2');
      assert.equal(output.dockerHost, 'euw2-host:1234/');
      assert.equal(output.localDockerHost, 'localhost:1234/');
      assert.equal(output.remoteDockerHosts[0], 'euw2-host:1234/');
      assert.equal(output.remoteDockerUrls[0], 'https://euw2-host:1234/');
    });
  });
});
