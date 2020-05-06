const fs = require('fs');
const path = require('path');
const PrintHelp = require('../commands/PrintHelp');
const commandRunner = require('./command/command-runner');

const INIT_FILE = './config/init.js';

async function showHelp(stack) {
  await commandRunner.run(stack, new PrintHelp());
}

async function execute(stack, params) {
  const options = params.filter(p => p.startsWith('--'));
  const serial = options.indexOf('--serial') >= 0;
  const debug = options.indexOf('--debug') >= 0 || options.indexOf('--verbose') >= 0;
  const force = options.indexOf('--force') >= 0;
  const enableRemoteRegistry = options.indexOf('--enable-remote-registry') >= 0;
  const registry = options.filter(o => o.startsWith('--registry=')).map(o => o.split('=')[1])[0] || 'local';
  const region = options.filter(o => o.startsWith('--region=')).map(o => o.split('=')[1])[0] || stack.dockerRegistry.remote.defaultRegion;
  const group = options.filter(o => o.startsWith('--group=')).map(o => o.split('=')[1])[0];
  const profile = options.filter(o => o.startsWith('--registry=')).map(o => o.split('=')[1])[0] || 'default';
  const withDependencies = options.indexOf('--with-deps') >= 0;

  const commandParameters = params.filter(p => !p.startsWith('--'));
  const command = commandParameters[0];
  const appName = commandParameters[1];

  if (!command) {
    return showHelp(stack);
  }

  const cmd = stack.commands.filter(c => c.commandName === command)[0];
  if (cmd === undefined) {
    console.error(`\nERROR: No such command ${command}`);
    return showHelp(stack);
  }

  const opts = {
    serial,
    debug,
    force,
    registry,
    region,
    enableRemoteRegistry,
    group,
    profile,
    withDependencies,
    params,
  };

  // Check for init file and run it if it exists
  const initFileStat = fs.lstatSync(INIT_FILE);
  if (initFileStat.code !== 'ENOENT') {
    const INIT = path.join(process.cwd(), INIT_FILE);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    await require(INIT)(stack, cmd, appName, opts, commandParameters);
  }

  return commandRunner.run(stack, cmd, appName, opts, commandParameters);
}

module.exports = execute;
