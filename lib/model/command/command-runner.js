/* eslint-disable no-param-reassign */
const _ = require('lodash');
const DependencyGraph = require('../DependencyGraph');

function clone(obj) {
  if (!obj) {
    return {};
  }

  return JSON.parse(JSON.stringify(obj));
}

const globalStateName = 'stack';

function appState(state, appName) {
  const stateClone = clone(state);
  const state2 = {};
  state2[globalStateName] = {};
  Object.assign(state2[globalStateName], stateClone[globalStateName]);
  Object.assign(state2, stateClone[appName]);

  return state2;
}

async function runRec(stack, command, state, appName, serial) {
  // eslint-disable-next-line new-cap
  const commandDepenencies = (command.dependsOn ? command.dependsOn : []).map(c => new c());
  for (const dep of commandDepenencies) {
    await runRec(stack, dep, state, appName, serial);
  }

  let apps = stack.getAppsAndContext();
  if (appName !== null) {
    if (appName.endsWith('*')) {
      const starts = appName.substr(0, appName.length - 1);
      apps = apps.filter(app => app.app.name.startsWith(starts));
    } else if (state.stack.withDependencies) {
      const dependencies = new DependencyGraph(stack).dependenciesOf(appName);
      apps = apps.filter(app => dependencies.has(app.app.name));
    } else {
      apps = apps.filter(app => app.app.name === appName);
    }
  }

  if (state.stack.group && state.stack.group.length > 0) {
    // Check for a defined group
    if (_.hasIn(stack, `groups.${state.stack.group}`)) {
      const groupsConfig = stack.groups[state.stack.group];
      const group = (Array.isArray(groupsConfig) ? groupsConfig : [groupsConfig])
        .map(re => new RegExp(re));
      apps = apps.filter(app => group.some(re => re.test(app.app.name)));
    } else {
      const re = new RegExp(state.stack.group);
      apps = apps.filter(app => re.test(app.app.name));
    }
  }

  if (command.isAppCommand) {
    const promises = [];
    for (const app of apps) {
      if (!command.supports(app.app)) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const appName2 = app.app.name;

      const promise = async () => {
        const appResponse = await command.run(app.app, appState(state, appName2), app.context);

        if (!state[appName2]) {
          state[appName2] = {};
        }

        state[appName2][command.constructor] = appResponse;
      };

      if (serial || command.runSerial) {
        await promise();
      } else {
        promises.push(promise());
      }
    }

    await Promise.all(promises);
  } else {
    const globalStateResponse = await command.run(stack, state.stack);

    if (!state[globalStateName]) {
      state[globalStateName] = {};
    }
    state[globalStateName][command.constructor] = globalStateResponse;

    // Copy to app states
    for (const app of apps) {
      const appName2 = app.app.name;
      if (!state[appName2]) {
        state[appName2] = {};
      }

      state[appName2][command.constructor] = globalStateResponse;
    }
  }

  return state;
}

async function run(
  stack,
  command,
  appName = null,
  opts = {},
  commandParameters,
) {
  opts.dir = `${__dirname}/../../..`;
  const initalState = {
    stack: opts,
    commandParameters,
  };

  return runRec(stack, command, initalState, appName, opts.serial);
}

module.exports = { run };
