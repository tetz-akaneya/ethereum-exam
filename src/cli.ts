#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('mycli')
  .description('My simple CLI tool')
  .version('1.0.0');

program
  .command('greet')
  .description('Say hello')
  .option('-n, --name <string>', 'Name to greet')
  .action((options) => {
    console.log(`Hello, ${options.name || 'world'}!`);
  });

program.parse();

