const sh = require('shorthash');
const urlJoin = require('url-join');

const Command = require('../model/command/Command');
const CreateOutputDir = require('./CreateOutputDir');
const GitClone = require('./GitClone');

const path = require('path');
const fs = require('fs');


class GenerateDockerConfig extends Command {
  constructor(getVersionMock = null, getDockerImageMock = null, writeDockerFileMock = null) {
    super();
    this.getVersion = getVersionMock || this.getVersion;
    this.getDockerImage = getDockerImageMock || this.getDockerImage;
    this.writeDockerFile = writeDockerFileMock || this.writeDockerFile;
  }

  get dependsOn() {
    return [CreateOutputDir, GitClone];
  }

  async run(app, state, context) {
    await super.run(app, state);
    const { dockerFile, hash } = this.writeDockerFile(app, state, context);
    const dockerFileRelative = path.relative(app.path || '.', dockerFile);

    const { dockerImage, version } = await this.getDockerImage(app, hash, state);

    // Get the Docker registry localDockerHost to use
    const localRegistry = app.stack.dockerRegistry.local;
    const remoteRegistry = app.stack.dockerRegistry.remote;

    const localDockerHost = localRegistry.host;
    const localDockerHttpUrl = urlJoin(localRegistry.ssl ? 'https://' : 'http://', localDockerHost);

    const region = state.stack.region || app.stack.dockerRegistry.remote.defaultRegion;

    const remoteDockerHosts = !remoteRegistry.hosts
      ? [remoteRegistry.host]
      : Object.values(remoteRegistry.hosts).sort(host =>
        // we want the prefered region first
        (host === remoteRegistry.hosts[region] ? -1 : 1));

    const remoteDockerUrls = remoteDockerHosts.map(remoteDockerHost => urlJoin(remoteRegistry.ssl ? 'https://' : 'http://', remoteDockerHost));

    return {
      dockerFile: dockerFileRelative,
      dockerHost: state.stack.registry === 'local' ? localDockerHost : remoteDockerHosts[0],
      localDockerHost,
      localDockerHttpUrl,
      remoteDockerHosts,
      remoteDockerUrls,
      dockerImage,
      version,
      region,
    };
  }

  /*
  The version of the Docker image built is composed of two parts:
  1. A hash of the content of the Dockerfile
  2. The app version

  The Dockerfile is generated from the stack configuration and if that change the Dockerfile
  might change, but it doesn't necessary if the changes are done to another app. This is
  why a hash of the Dockerfile is used and not the stack config git hash.
*/
  async getVersion(hash, app, state) {
    // If we are forcing a build we use the current timestamp as version.
    if (state.stack.force) {
      return `app-local-${Date.now()}`;
    }

    const v = [`docker-${hash}`];
    const appVersion = await app.getVersion();
    if (appVersion) {
      v.push(appVersion);
    }

    return v.join('_');
  }

  async getDockerImage(app, hash, state) {
    const version = await this.getVersion(hash, app, state);
    const dockerImage = `${app.stack.name}-${app.name}:${version}`;
    return { dockerImage, version };
  }

  writeDockerFile(app, state, context) {
    const content = app.container.renderDockerFile(app, context);
    const hash = sh.unique(content);
    const dockerFile = `${state[CreateOutputDir].dir}/${app.name}-Dockerfile`;
    fs.writeFileSync(dockerFile, content);

    return { dockerFile, hash };
  }
}

module.exports = GenerateDockerConfig;
