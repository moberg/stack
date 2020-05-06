/* eslint-disable no-param-reassign */
const { App, Infrastructure, DataApp } = require('./app');
const Stack = require('./Stack');
const yaml = require('../util/yaml');
const Container = require('./Container');
const ConfigResolver = require('./ConfigResolver');

function exit(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function validateStackConfig(config) {
  if (!config.name) exit('No name specified for stack');

  return config;
}

function validateContainerConfig(config) {
  if (!config.name) exit(`No name specified for container: ${JSON.stringify(config)}`);
  if (!config.dockerFile) exit(`No dockerFile specified for container: ${config.name}`);

  return config;
}

function validateInfrastructureConfig(config, containers) {
  if (!config.name) exit(`No name specified for container: ${JSON.stringify(config)}`);
  if (!config.container) exit(`No container specified for infrastructure: ${config.name}`);
  if (containers[config.container] === undefined) exit(`Could not find container ${config.container} for ${config.name}`);

  return config;
}

function toMap(array, key) {
  return array.reduce((result, obj) => {
    result[obj[key]] = obj;
    return result;
  }, {});
}


async function load(commands) {
  let stackConfig = null;
  try {
    stackConfig = validateStackConfig(yaml.readFile(`${process.cwd()}/config/stack.yml`));
  } catch (e) {
    console.error(e);
    exit('Could not read config/stackConfig.yml');
  }

  const configResolver = new ConfigResolver();

  const containers = toMap(yaml.loadDir(`${process.cwd()}/config/containers`)
    .map(c => validateContainerConfig(c))
    .map((c) => {
      c.resolve = configResolver;
      c.stackConfig = stackConfig;

      if (c.script) {
        const scriptFile = `${process.cwd()}/config/containers/scripts/${c.script}`;
        // eslint-disable-next-line global-require,import/no-dynamic-require
        return new (require(scriptFile))(c);
      }
      return new Container(c);
    }), 'name');

  async function loadApp(config, clazz) {
    config.resolve = configResolver;
    config.stack = stackConfig;

    if (!containers[config.container]) {
      exit(`${config.name} is using a container that is not defined: ${config.container}`);
    }

    config.container = containers[config.container];
    config.secrets = config.secrets || [];

    const infra = {};
    if (config.infrastructure) {
      for (const name of Object.keys(config.infrastructure)) {
        const c = config.infrastructure[name];
        c.name = `${config.name}-${name}`;
        c.variables = [];
        infra[c.name] = await loadApp(c, Infrastructure);
      }
    }
    config.infrastructure = infra;
    // eslint-disable-next-line new-cap
    return new clazz(config);
  }

  async function loadApps(dir, validator, clazz) {
    const config = yaml.loadDir(dir)
      .map(app => validator(app, containers))
      .filter(config2 => !config2.disabled === true);

    const apps = [];
    for (const c of config) {
      const app = await loadApp(c, clazz);
      apps.push(app);
    }
    return apps;
  }

  const infrastructure = await loadApps(`${process.cwd()}/config/infrastructure`, validateInfrastructureConfig, Infrastructure);
  const apps = await loadApps(`${process.cwd()}/config/apps`, validateInfrastructureConfig, App);

  if (stackConfig.data) {
    for (const name of Object.keys(stackConfig.data)) {
      const repo = stackConfig.data[name];
      apps.push(new DataApp({
        name,
        path: `./data/${name}`,
        git: repo,
      }));
    }
  }

  const stack = new Stack(stackConfig, apps, infrastructure);

  configResolver.set(containers, toMap(infrastructure, 'name'), toMap(apps, 'name'), stack);

  // eslint-disable-next-line new-cap
  stack.commands = commands.map(c => new c());

  if (commands.plugins) {
    for (const plugin of Object.keys(commands.plugins)) {
      await commands.plugins[plugin].init(stackConfig, stack);
    }
  }

  return stack;
}

module.exports = load;
