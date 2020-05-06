/* eslint-disable global-require,import/no-dynamic-require */
const fs = require('fs');
const path = require('path');

const normalizedPath = path.join(__dirname, '../../commands');

// Load built in commands
const commands = fs
  .readdirSync(normalizedPath)
  .map(file => require(`../../commands/${file}`));


// Load commands from plugins. This is very hacky and there's probably some much better way
// to do this.
commands.plugins = {};

fs.readdirSync('./node_modules')
  .filter(d => d.startsWith('stack-'))
  .forEach((pluginDir) => {
    const pluginCmdPath = path.resolve(`./node_modules/${pluginDir}/lib/commands`);

    const pluginPath = path.resolve(`./node_modules/${pluginDir}`);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const info = require(path.join(pluginPath, 'index.js'));

    commands.plugins[info.name] = info;

    fs.readdirSync(pluginCmdPath)
      .forEach((cmdFile) => {
        const cmd = require(path.join(pluginCmdPath, cmdFile));
        cmd.plugin = info.name;

        commands.push(cmd);
      });
  });

module.exports = commands;
