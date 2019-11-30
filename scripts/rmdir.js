const path = require('path');
const fs = require('fs');

if ( ! fs.existsSync(path.resolve(__dirname, '..', 'dist')) ) return;

console.log('Cleaning build directory...');
fs.rmdirSync(path.resolve(__dirname, '..', 'dist'), { recursive: true });
fs.mkdirSync(path.resolve(__dirname, '..', 'dist'));
console.log('Build directory was cleaned');
