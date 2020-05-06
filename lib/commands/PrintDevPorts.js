const Command = require('../model/command/Command');

class PrintDevPorts extends Command {
  get commandName() { return 'dev-ports'; }
  get commandDescription() { return 'Print the local dev ports'; }

  async run(stack) {
    console.log('\nLocal development ports:');
    for (const infra of Object.keys(stack._infrastructure)) {
      console.log(`${stack._infrastructure[infra].name}: localhost:${stack._infrastructure[infra].localDevPort}`);
    }

    stack._apps.forEach((a) => {
      console.log(`${a.name}: localhost:${a.localDevPort}`);

      for (const infra of Object.keys(a.infrastructure)) {
        console.log(`${a.infrastructure[infra].name}: localhost:${a.infrastructure[infra].localDevPort}`);
      }
    });
    console.log();
  }
}


module.exports = PrintDevPorts;
