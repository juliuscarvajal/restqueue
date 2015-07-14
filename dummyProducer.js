'use strict';

var amqp = require('amqplib');
var when = require('when');
var config = require('./config.json');

var connection = amqp.connect(config.amqpUrl);

connection.then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });

  console.log('Connected...');
  return when(conn.createChannel().then(function(ch) {
    var ok = ch.assertExchange(config.requestExchange);
    
    return ok.then(function() {
      ///TODO: msg should be seggregated...
      var msg = process.argv.slice(2).join(' ');    
      var clientId = process.argv[4]; //TODO:
      ///TODO: msg should be seggregated...
      
      ch.publish(config.requestExchange, 
                 clientId, 
                 new Buffer(msg));

      console.log(" [x] Sent '%s'", msg);
      return ch.close();
    });
  })).ensure(function() { conn.close(); });
}).then(null, console.warn);
