const Template = require('../util/Template');

class Container {
  constructor(config) {
    Object.assign(this, config);
    this._dockerFile = new Template(config.dockerFile);
  }

  renderDockerFile(appConfig) {
    return this._dockerFile.render(appConfig.resolveVariables());
  }

  // eslint-disable-next-line no-unused-vars,no-empty-function
  async preBuild(appConfig) {

  }

  // eslint-disable-next-line no-unused-vars,no-empty-function
  async postBuild(appConfig) {

  }

  get host() {
    return `${this.stack.name}-${this.name}`;
  }

  // eslint-disable-next-line no-unused-vars
  getNetworkDependencies(appConfig) {
    return [];
  }
}

module.exports = Container;
