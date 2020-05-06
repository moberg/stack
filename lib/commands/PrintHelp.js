const Command = require('../model/command/Command');

function dynamicSort(property) {
  let p2 = property;
  let sortOrder = 1;
  if (property[0] === '-') {
    sortOrder = -1;
    p2 = p2.substr(1);
  }
  return (a, b) => {
    // eslint-disable-next-line no-nested-ternary
    const result = (a[p2] < b[p2]) ? -1 : (a[p2] > b[p2]) ? 1 : 0;
    return result * sortOrder;
  };
}

class PrintHelp extends Command {
  get commandName() { return 'help'; }
  get commandDescription() { return 'Displays usage'; }

  async run(stack) {
    console.log('');

    const help = [];

    // Filter out internally used commands (commands without name)
    for (const cmd of stack.commands.filter(c => c.commandName)) {
      const params = cmd.isAppCommand ? '<app>' : '';
      help.push({ command: `${cmd.commandName} ${params}`, description: cmd.commandDescription, cmd });
    }

    let longestLine = 0;
    help.sort(dynamicSort('command'));

    help.forEach((h) => {
      if (h.command.length > longestLine) {
        longestLine = h.command.length;
      }
    });

    const options = [
      { option: '--serial', description: 'Run commands in serial (default is in parallel)' },
      { option: '--debug', description: 'Print debug output' },
      { option: '--verbose', description: 'Be verbose' },
      { option: '--force', description: 'Force the operation' },
      { option: '--registry=local|remote', description: 'Use the local (default) or remote Docker registry' },
      { option: '--enable-remote-registry', description: 'Check the remote registry before building locally. Disabled by default until Octa/AWS integration is implemented.' },
      { option: '--region=use1', description: 'Region to target. Example: use1, usw2' },
      { option: '--with-deps', description: 'Run an app command on the app and on all apps it depend on.' },
    ];

    console.log('Usage: stack [command] [options]\n');

    console.log('  Options:\n');
    options.forEach((o) => {
      const extra = longestLine - o.option.length;
      const extraSpace = ' '.repeat(extra > 0 ? extra : 0);
      console.log(`    ${o.option}${extraSpace}  ${o.description}`);
    });

    console.log('\n  Commands:\n');
    help.filter(h => !h.cmd.constructor.plugin).forEach((h) => {
      const extraSpace = ' '.repeat(longestLine - h.command.length);
      console.log(`    ${h.command}${extraSpace}  ${h.description}`);
    });


    if (help.filter(h => h.cmd.constructor.plugin).length > 0) {
      console.log('\n  Plugin commands:\n');
      help.filter(h => h.cmd.constructor.plugin).forEach((h) => {
        const extraSpace = ' '.repeat(longestLine - h.command.length);
        console.log(`    ${h.command}${extraSpace}  ${h.description}`);
      });
    }

    console.log('');
  }
}


module.exports = PrintHelp;
