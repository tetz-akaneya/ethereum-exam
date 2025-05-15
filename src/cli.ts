#!/usr/bin/env ts-node
import { Command } from 'commander';

import { createSignCommand } from './cli/signCommand.js';

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

program.addCommand(createSignCommand());

program.parse(process.argv);
