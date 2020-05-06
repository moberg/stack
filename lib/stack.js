#!/usr/bin/env node
const config = require('./config');
const commandParser = require('./model/command-parser');

async function main() {
  const stack = await config();
  await commandParser(stack, process.argv.slice(2, process.argv.length));
}

main()
  .catch((err) => {
    console.log('ERROR:');
    console.log(err);
  });
