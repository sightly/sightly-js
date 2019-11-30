const path = require('path');
const fs = require('fs');
const config = require(path.resolve(__dirname, '..', 'dist', 'config.json'));
const env = process.argv[2];

console.log('Configuring the build...');

if ( ! env || ! ['dev', 'prod'].includes(env.trim().toLowerCase()) )
  return console.log('Invalid or missing environment flag!');

config.logsServerHost = env.trim().toLowerCase() === 'prod' ? 'https://logs.sightly.dev' : 'http://localhost:3000';
config.alertsServerUrl = env.trim().toLowerCase() === 'prod' ? 'https://alerts.sightly.dev' : 'http://localhost:3000';

fs.writeFileSync(path.resolve(__dirname, '..', 'dist', 'config.json'), JSON.stringify(config, null, 2));

console.log('Build was configured for', env.trim().toLowerCase() === 'prod' ? 'production' : 'development');
