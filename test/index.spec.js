const chai = require('chai');
const expect = chai.expect;
const request = require('request');
const path = require('path');
const config = require(path.resolve(__dirname, '..', 'dist', 'config.json'));

// Check if the dev server is running
before(function(done) {

  setTimeout(() => {

    request.get(config.logsServerHost + '/test', (error, res) => {

      if ( error ) return done(error);
      if ( res.statusCode !== 200 ) return done(new Error(`Test server responded with status ${res.statusCode}!`));

      done();

    });

  }, 1000);

});

describe('Sightly', function() {

  // Import all tests
  require(path.resolve(__dirname, 'client', 'sightly.spec.js'));

});

// // Kill the server
// after(function(done) {
//
//   setTimeout(() => {
//
//     request.post(config.logsServerHost + '/kill', () => {
//
//       done();
//
//     });
//
//   }, 1000);
//
// });
