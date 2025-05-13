#!/usr/bin/env node
import { Command } from 'commander';
import { deriveKey } from './generateHdKey.js';
import { readFileSync } from 'fs'
import path from 'path'

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

program
  .command('address')
  .description('derives addresses from private key and paths')
  .option('-c, --config <path>', 'Path to config file')
  .action((options) => {
    options.config ||= 'secret_params.json'
    console.log(33)
    const json = JSON.parse(readFileSync(path.resolve(options.config), 'utf8'))
    console.log(json)
    return
    const key = deriveKey({
      mnemonicString: json.mnemonic,
      passphrase: json.passphrase,
      path: json.derivePath,
    })

    console.log(`Address: ${key.address}`)
    console.log(`Private Key: ${key.privateKey}`)
  })

program.parse();

