/* eslint-disable no-param-reassign */
const fs = require('fs');
const path = require('path');

function findInDir(startPath, filter, result, options = { recursive: true }) {
  if (!fs.existsSync(startPath)) {
    return result;
  }

  result = result != null ? result : [];
  const files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i += 1) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory() && options.recursive) {
      findInDir(filename, filter, result, options); // recurse
    } else if (filter.test(filename)) {
      result.push(filename);
    }
  }

  return result;
}

module.exports = { findInDir };
