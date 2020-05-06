const { App } = require('./App');

class Infrastructure extends App {
  /*
      An infrastructure app doesn't have a version since there's no source code for it
      (that we write)
  */
  async getVersion() {
    return '';
  }
}

module.exports = { Infrastructure };
