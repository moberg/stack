const _ = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs');
const CreateOutputDir = require('./CreateOutputDir');
const Template = require('../util/Template');
const Command = require('../model/command/Command');
const BuildAppDockerImage = require('./BuildAppDockerImage');

function overrideConfig(file, app, part) {
  let config = yaml.safeLoad(fs.readFileSync(file).toString());

  if (app.stack.kubernetes && app.stack.kubernetes[part]) {
    config = _.merge(config, app.stack.kubernetes[part]);
  }

  if (app.kubernetes && app.kubernetes[part]) {
    config = _.merge(config, app.kubernetes[part]);
  }

  fs.writeFileSync(file, yaml.safeDump(config));
}

class GenerateKubernetesDeploymentAndServiceConfig extends Command {
  get dependsOn() {
    return [CreateOutputDir, BuildAppDockerImage];
  }

  supports(app) {
    return !app.type || app.type === 'app' || app.type === 'endpoint';
  }

  async run(app, state) {
    await super.run(app, state);
    if (app.type === 'endpoint') {
      return this.endpointApplication(state, app);
    }

    return this.normalApplication(state, app);
  }

  normalApplication(state, app) {
    const templatePath = `${state.stack.dir}/templates/kubernetes`;

    const { dockerImage, dockerHost } = state[BuildAppDockerImage];
    const deployment = new Template(fs.readFileSync(`${templatePath}/deployment.yml`).toString());

    const dir = `${state[CreateOutputDir].dir}/kubernetes`;
    const deploymentFile = `${dir}/${app.stack.name}-${app.name}-deployment.yml`;

    fs.writeFileSync(deploymentFile, deployment.render({
      name: `${app.stack.name}-${app.name}`,
      port: app.port,
      extraPorts: app.extraPorts,
      dockerImage: `${dockerHost}${dockerImage}`,
      secrets: app.secrets.map(key => ({
        secretName: `${app.name}-secret`,
        secretKey: key,
        envName: key,
      })),
    }));

    const serviceTemplate = app.expose
      ? `${templatePath}/service-loadbalancer.yml`
      : `${templatePath}/service-clusterip.yml`;

    const serviceFile = `${dir}/${app.stack.name}-${app.name}-service.yml`;
    const service = new Template(fs.readFileSync(serviceTemplate).toString());
    fs.writeFileSync(serviceFile, service.render({
      name: `${app.stack.name}-${app.name}`,
      port: app.port,
      extraPorts: app.extraPorts,
      targetPort: app.port,
    }));

    // Override kubernetes configuration from stack and app
    overrideConfig(deploymentFile, app, 'deployment');
    overrideConfig(serviceFile, app, 'service');

    return { dir };
  }

  endpointApplication(state, app) {
    const dir = `${state[CreateOutputDir].dir}/kubernetes`;
    const templatePath = `${state.stack.dir}/templates/kubernetes`;

    // Service
    const serviceTemplate = `${templatePath}/service-externalname.yml`;
    const serviceOutput = `${dir}/${app.stack.name}-${app.name}-service.yml`;
    const st = new Template(fs.readFileSync(serviceTemplate).toString());
    fs.writeFileSync(serviceOutput, st.render({
      name: `${app.stack.name}-${app.name}`,
      port: app.port,
      host: app.host,
      extraPorts: app.extraPorts,
      targetPort: app.port,
    }));

    return { dir };
  }
}

module.exports = GenerateKubernetesDeploymentAndServiceConfig;
