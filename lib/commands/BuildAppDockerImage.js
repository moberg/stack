const fs = require('fs');
const Command = require('../model/command/Command');
const GenerateDockerConfig = require('./GenerateDockerConfig');
const GitClone = require('./GitClone');
const { findInDir } = require('../util/files');
const { imageExistsInRepository } = require('../util/dockerRegistry');
const Lock = require('../util/Lock');

const buildLock = new Lock();

class BuildAppDockerImage extends Command {
  constructor(imageExistsInRepositoryMock) {
    super();
    this.imageExistsInRepository = imageExistsInRepositoryMock || imageExistsInRepository;
  }

  get dependsOn() {
    return [GitClone, GenerateDockerConfig];
  }

  get runSerial() {
    return false;
  }

  async run(app, state, context) {
    await super.run(app, state);

    let dockerIgnoreFiles = [];
    if (app.disableDockerIgnore) {
      dockerIgnoreFiles = findInDir(app.path, /\.dockerignore$/, [], { recursive: true });
      dockerIgnoreFiles.forEach(f => fs.renameSync(f, `${f}-disabled`));
    }

    try {
      const options = { path: app.path, debug: state.stack.debug };
      const { dockerFile, dockerImage, region } = state[GenerateDockerConfig];
      const getUrl = (host, ssl) => (ssl ? `https://${host}` : `http://${host}`);
      const dockerConfig = app.stack.dockerRegistry;
      const targets = [];
      const buildResult = { };

      // Check if images are built
      const image = `${dockerConfig.remote.prefix}/${dockerImage}`;

      if (state.stack.registry === 'local') {
        let built = false;

        if (state.stack.enableRemoteRegistry) {
          const remoteImage = image;
          built = await this.imageExistsInRepository(
            getUrl(
              dockerConfig.remote.hosts[region],
              dockerConfig.remote.ssl,
            ),
            remoteImage,
          );

          if (built) {
            buildResult.dockerHost = dockerConfig.remote.hosts[region];
            buildResult.dockerImage = remoteImage;
          }
        }

        if (!built) {
          const url = getUrl(dockerConfig.local.host, dockerConfig.local.ssl);
          const localImage = `${dockerConfig.local.prefix}/${dockerImage}`;
          built = await this.imageExistsInRepository(url, localImage);

          buildResult.dockerHost = dockerConfig.local.host;
          buildResult.dockerImage = localImage;
        }

        targets.push({ host: `${dockerConfig.local.host}${dockerConfig.local.prefix}/`, built, destination: 'local' });
      } else if (state.stack.registry === 'remote') {
        for (const host of Object.values(dockerConfig.remote.hosts)) {
          const url = getUrl(host, dockerConfig.remote.ssl);
          const built = await this.imageExistsInRepository(url, image);
          targets.push({ host: `${host}${dockerConfig.remote.prefix}/`, built, destination: 'remote' });
        }

        buildResult.dockerHost = dockerConfig.remote.hosts[state.stack.region];
        buildResult.dockerImage = image;
      }

      // Build image if needed (missing in any registry)
      if (!targets.every(t => t.built)) {
        await buildLock.acquire();
        await app.container.preBuild(app, context);

        console.warn(`Building ${dockerImage}`);
        await app.run(`docker build -t ${dockerImage} -f ${dockerFile} .`, {
          path: app.path,
          debug: state.stack.debug,
          env: { DOCKER_BUILDKIT: 1 },
        });
        buildLock.release();

        // Tag and push images
        for (const target of targets) {
          if (target.destination === 'local' || dockerImage.indexOf('app-local-') < 0 || state.stack.force) {
            console.warn(`Tagging and pushing image to ${target.host}${dockerImage}`);

            await app.run(`docker tag ${dockerImage} ${target.host}${dockerImage}`, options);
            await app.run(`docker push ${target.host}${dockerImage}`, options);
          } else {
            console.warn(`WARN: ${dockerImage} is an image with local modifications, will not push to remote.`);
          }
        }
      } else {
        console.warn(`Docker image ${dockerImage} already in registry ${buildResult.dockerHost}, skipping build.`);
      }

      return buildResult;
    } catch (e) {
      console.error(`ERROR: Failed to build ${app.name}`);
      console.error(e);
      process.exit(1);
    } finally {
      if (app.disableDockerIgnore) {
        dockerIgnoreFiles.forEach(f => fs.renameSync(`${f}-disabled`, f));
      }
      await app.container.postBuild(app, context);
    }

    return Command.NO_STATE_CHANGE;
  }
}


module.exports = BuildAppDockerImage;
