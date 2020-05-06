const { App } = require('../lib/model/app/App');
const Container = require('../lib/model/Container');
const Stack = require('../lib/model/Stack');
const { Infrastructure } = require('../lib/model/app/Infrastructure');

function mockContainer(name = 'the-container') {
  return new Container({
    name,
    extraPorts: [],
    dockerFile: '',
  });
}

function mockApp(name = 'the-app') {
  return new App({
    name,
    container: mockContainer(`${name}-container`),
    infrastructure: {},
  });
}

function mockInfra(name = 'the-infra') {
  return new Infrastructure({
    name,
    container: mockContainer(`${name}-container`),
  });
}

function mockStack(name = 'mock-stack', commands) {
  const apps = [mockApp('app1'), mockApp('app2')];
  const infra = [mockInfra('infra1')];

  // eslint-disable-next-line no-param-reassign
  commands.plugins = {};

  const stack = new Stack(
    {
      name,
      // eslint-disable-next-line new-cap
      commands: commands.map(c => new c()),
      dockerRegistry: {
        local: {
          prefix: 'stack-prefix',
          host: 'localhost:1234/',
          ssl: false,
        },
        remote: {
          prefix: 'remote-registry',
          ssl: true,
          defaultRegion: 'usw2',
          hosts: {
            usw2: 'usw2-host:1234/',
            use1: 'use1-host:1234/',
            euw2: 'euw2-host:1234/',
          },
        },
      },
    },
    apps,
    infra,
  );

  // eslint-disable-next-line no-return-assign,no-param-reassign
  apps.forEach(a => a.stack = stack);

  // eslint-disable-next-line no-return-assign,no-param-reassign
  infra.forEach(i => i.stack = stack);

  return stack;
}

module.exports = {
  mockContainer,
  mockApp,
  mockInfra,
  mockStack,
};
