#!/usr/bin/env node
import { Command } from 'commander';
import { createAddressCommand } from './cli/address.js';

const program = new Command();

program
  .name('ethereum_exam')
  .description('My simple CLI tool')
  .version('1.0.0');

program
  .command('greet')
  .description('Say hello')
  .option('-n, --name <string>', 'Name to greet')
  .action((options) => {
    console.log(`Hello, ${options.name || 'world'}!`);
  });

const addressCommand = createAddressCommand();
program.addCommand(addressCommand);

program.parse(process.argv);
