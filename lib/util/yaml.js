const yaml = require('js-yaml');
const fs = require('fs');
const Template = require('./Template');
const { findInDir } = require('./files');

function readFile(f) {
  const content = fs.readFileSync(f).toString();
  const file = yaml.safeLoad(content);
  file.variables = new Template(content).variables;
  return file;
}

function loadDir(...dirs) {
  const includeDirs = Array.prototype.concat.apply(
    [],
    dirs.map(d => findInDir(d, /\.yml$/, [], { recursive: true })),
  );

  return includeDirs
    .filter(f => f)
    .map(f => readFile(f));
}

module.exports = {
  loadDir,
  readFile,
};
