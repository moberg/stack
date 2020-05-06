const { exec } = require('child_process');

class Process {
  constructor(cmd) {
    this._cmd = cmd;
    this._stdout = [];
    this._stderr = [];
  }

  async run(options = { debug: true, suppressAllOutput: false }) {
    const opts = {
      debug: options.debug,
      printCmd: options.printCmd || options.debug,
      cwd: options.path || '.',
      suppressAllOutput: options.suppressAllOutput,
    };

    return new Promise((accept, reject) => {
      if (opts.debug) {
        console.error(` > ${this._cmd} [${opts.cwd === '.' ? './' : opts.cwd}]`);
      }
      // Standard buffer is 200*1024, this is too small for some commands that output large
      // amounts of data in a short period
      const execOptions = {
        cwd: opts.cwd,
        shell: '/bin/bash',
        maxBuffer: 1024 * 1024,
      };

      if (options.env) {
        execOptions.env = options.env;
      }

      this._child = exec(this._cmd, execOptions, (error, stdout, stderr) => {
        if (error) {
          if (!opts.suppressAllOutput) {
            console.error(stderr.toString());
          }
          reject(stderr.toString());
        }

        if (opts.debug && !opts.suppressAllOutput) {
          const so = stdout.toString().trim();
          if (so.length > 0) {
            console.error(so);
          }

          const se = stderr.toString().trim();
          if (se.length > 0) {
            console.error(se);
          }
        }

        accept(stdout.toString());
      });
    });
  }

  stop() {
    this._child.kill('SIGINT');
  }


  get output() {
    return this._stdout.join('').trim();
  }

  get stderr() {
    return this._stderr.join('').trim();
  }

  get pid() {
    if (this._child) {
      return this._child.pid;
    }
    return null;
  }

  static async run(cmd, options) {
    return new Process(cmd).run(options);
  }
}

module.exports = Process;
