const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const distPath = path.resolve(__dirname, '..', '..', 'dist');
const SightlyClient = require(path.join(distPath)).Client;

describe('Client', function() {

  const client = new SightlyClient('test-token');

  describe('Logger', function() {

    const log = client.logger();

    it('should log something...', async function() {

      this.timeout(60000);

      log
      .debug('This message was logged at debug level...')
      .info('Some log at info level')
      .warn('This is a warning message!')
      .notice('This is a notice; Pay attention!');

      await client.close(true);

      client.reconnect();

      log
      .tag('ERROR_1')
      .error('Error has occurred!', new Error('Some error message!'));

      await client.close();

    });

  });

  after(function() {

    // client.close();

  });

});
