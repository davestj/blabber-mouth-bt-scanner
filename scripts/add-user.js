#!/usr/bin/env node
const readline = require('readline');
const { saveCredentials } = require('../credentials');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Username: ', username => {
  rl.question('Password: ', password => {
    saveCredentials(username, password);
    console.log('Credentials saved.');
    rl.close();
  });
});
