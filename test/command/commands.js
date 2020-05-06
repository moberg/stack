/* eslint-disable no-unused-vars */
const assert = require('assert');
const commandRunner = require('../../lib/model/command/command-runner');
const Command = require('../../lib/model/command/Command');
const { mockStack } = require('../mocks');

class Command1 extends Command {
  get dependsOn() {
    return [];
  }
  get commandName() { return 'command1'; }

  async run(app, state) {
    return `${app.name}-command1`;
  }
}


class Command22 extends Command {
  get commandName() { return 'command22'; }

  get dependsOn() {
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  async run(stack, state) {
    return 'command22';
  }
}

class Command2 extends Command {
  get commandName() { return 'command2'; }

  get dependsOn() {
    return [Command1, Command22];
  }

  async run(stack, state) {
    const result = `${stack.name + state[Command22]}-command2`;
    return result;
  }
}

class Command3 extends Command {
  get commandName() { return 'command3'; }

  get dependsOn() {
    return [Command2];
  }

  async run(app, state) {
    console.log(`${this.name} running for app: ${app.name}`);
    return `${app.name + state[Command2]}-command3`;
  }
}

describe('Command runner', () => {
  describe('run()', () => {
    it('The command should be executed for all apps', async () => {
      const stack = mockStack('mockstack', [Command1, Command2, Command3]);
      const state = await commandRunner.run(stack, new Command3());

      assert.equal('app1-command1', state.app1[Command1]);
      assert.equal('app2-command1', state.app2[Command1]);

      assert.equal('mockstackcommand22-command2', state.app1[Command2]);
      assert.equal('mockstackcommand22-command2', state.app2[Command2]);
    });
  });
});
