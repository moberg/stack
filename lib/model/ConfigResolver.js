class ConfigResolver {
  constructor() {
    this.containers = {};
    this.infrastructure = {};
    this.apps = {};
  }

  set(containers, infra, apps, stack) {
    this.containers = containers;
    this.infrastructure = infra;
    this.apps = apps;
    this.stack = stack;
  }
}

module.exports = ConfigResolver;
