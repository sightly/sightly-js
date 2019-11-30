const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const distPath = path.resolve(__dirname, '..', '..', 'dist');
const SightlyClient = require(path.join(distPath)).Client;

describe('Client', function() {

  const client = new SightlyClient('test-token');

  describe('Logger', function() {

    const log = client.logger();

    it('should log something...', function(done) {

      this.timeout(60000);

      log
      .debug('This message was logged at debug level...')
      .info('Some log at info level')
      .warn('This is a warning message!')
      .notice('This is a notice; Pay attention!');

      client.close(true).then(() => {

        client.reconnect();

        log
        .tag('ERROR_1')
        .error('Error has occurred!', new Error('Some error message!'));

        setTimeout(done, 2000);

      });

    });

  });

  after(function() {

    // client.close();

  });

});
