const assert = require('assert');
const BuildAppDockerImage = require('../../lib/commands/BuildAppDockerImage');
const GenerateDockerConfig = require('../../lib/commands/GenerateDockerConfig');
const { mockStack } = require('../mocks');


describe('BuildAppDockerImage', () => {
  describe('run()', async () => {
    let cmd = null;
    let app = null;
    let exists = false;
    let commandsExecuted = [];

    beforeEach(async () => {
      exists = false;
      commandsExecuted = [];
      const stack = mockStack('mockstack', []);
      // eslint-disable-next-line prefer-destructuring
      app = stack._apps[0];
      app.run = (cmd2) => {
        commandsExecuted.push(cmd2);
      };

      cmd = new BuildAppDockerImage(async () => exists);
    });

    describe('registry=local', async () => {
      const registry = 'local';

      it('image does not exist locally, enableRemoteRegistry=false', async () => {
        const state = {
          stack: {
            enableRemoteRegistry: false, registry, region: 'use1', debug: false,
          },
        };
        state[GenerateDockerConfig] = { dockerFile: 'the-docker-file', dockerImage: 'the-docker-image', region: 'use1' };

        const output = await cmd.run(app, state);
        assert.equal(output.dockerHost, 'localhost:1234/');
        assert.equal(output.dockerImage, 'stack-prefix/the-docker-image');

        assert.equal(commandsExecuted[0], 'docker build -t the-docker-image -f the-docker-file .');
        assert.equal(commandsExecuted[1], 'docker tag the-docker-image localhost:1234/stack-prefix/the-docker-image');
        assert.equal(commandsExecuted[2], 'docker push localhost:1234/stack-prefix/the-docker-image');
      });

      it('image exists locally, enableRemoteRegistry=false', async () => {
        exists = true;
        const state = {
          stack: {
            enableRemoteRegistry: false, registry, region: 'use1', debug: false,
          },
        };
        state[GenerateDockerConfig] = { dockerFile: 'the-docker-file', dockerImage: 'the-docker-image', region: 'use1' };

        const output = await cmd.run(app, state);
        assert.equal(output.dockerHost, 'localhost:1234/');
        assert.equal(output.dockerImage, 'stack-prefix/the-docker-image');

        // Image is already built, so we should not build it again
        assert.equal(commandsExecuted.length, 0);
      });

      it('image does not exist in remote, or in local, enableRemoteRegistry=true', async () => {
        exists = false;
        const state = {
          stack: {
            enableRemoteRegistry: true, registry, region: 'use1', debug: false,
          },
        };
        state[GenerateDockerConfig] = { dockerFile: 'the-docker-file', dockerImage: 'the-docker-image', region: 'use1' };

        const output = await cmd.run(app, state);
        assert.equal(output.dockerHost, 'localhost:1234/');
        assert.equal(output.dockerImage, 'stack-prefix/the-docker-image');

        // Since the image does not exist remotely or locally we should build it
        assert.equal(commandsExecuted[0], 'docker build -t the-docker-image -f the-docker-file .');
        assert.equal(commandsExecuted[1], 'docker tag the-docker-image localhost:1234/stack-prefix/the-docker-image');
        assert.equal(commandsExecuted[2], 'docker push localhost:1234/stack-prefix/the-docker-image');
      });

      it('image exists remotely, enableRemoteRegistry=true', async () => {
        exists = true;
        const state = {
          stack: {
            enableRemoteRegistry: true, registry, region: 'use1', debug: false,
          },
        };
        state[GenerateDockerConfig] = { dockerFile: 'the-docker-file', dockerImage: 'the-docker-image', region: 'use1' };

        const output = await cmd.run(app, state);
        assert.equal(output.dockerHost, 'use1-host:1234/');
        assert.equal(output.dockerImage, 'remote-registry/the-docker-image');

        // Image is already built, so we should not build it again
        assert.equal(commandsExecuted.length, 0);
      });
    });

    describe('registry=remote', async () => {
      const registry = 'remote';

      describe('when the image does not exit in remote', async () => {
        it('should build and push the image to all registries', async () => {
          const state = {
            stack: {
              enableRemoteRegistry: false, registry, region: 'use1', debug: false,
            },
          };
          state[GenerateDockerConfig] = { dockerFile: 'the-docker-file', dockerImage: 'the-docker-image', region: 'use1' };
          await cmd.run(app, state);

          assert.equal(commandsExecuted[0], 'docker build -t the-docker-image -f the-docker-file .');
          assert.ok(commandsExecuted.indexOf('docker tag the-docker-image usw2-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker push usw2-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker tag the-docker-image use1-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker push use1-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker tag the-docker-image euw2-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker push euw2-host:1234/remote-registry/the-docker-image') > 0);
        });
      });

      describe('when the image is missing in one of the registries', async () => {
        it('should build and push the image to all registries', async () => {
          cmd = new BuildAppDockerImage(async url => url.indexOf('use1') >= 0);

          const state = {
            stack: {
              enableRemoteRegistry: false, registry, region: 'use1', debug: false,
            },
          };
          state[GenerateDockerConfig] = { dockerFile: 'the-docker-file', dockerImage: 'the-docker-image', region: 'use1' };

          await cmd.run(app, state);

          assert.equal(commandsExecuted[0], 'docker build -t the-docker-image -f the-docker-file .');
          assert.ok(commandsExecuted.indexOf('docker tag the-docker-image usw2-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker push usw2-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker tag the-docker-image use1-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker push use1-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker tag the-docker-image euw2-host:1234/remote-registry/the-docker-image') > 0);
          assert.ok(commandsExecuted.indexOf('docker push euw2-host:1234/remote-registry/the-docker-image') > 0);
        });
      });
    });
  });
});
