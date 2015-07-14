'use strict';

var _ = require('lodash');
var http = require('http');
var amqp = require('amqplib');
var config = require('./config.json');

//TODO: Get all clients from DB
var clients = [
  "clientid:1",
  "clientid:2",
  "clientid:3",
  "clientid:4",  
];

var send = function(msg, ch) {
  var body = msg.content.toString();
  console.log(" [x] Received '%s'", body);

  //TODO:
  var options = {
    host: 'localhost',
    port: 8081,
    path: '/servoy-service/rest_ws/api_gateway/v0/jobs', //hard code for now...
    method: 'GET'
  };

  http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
    console.log(" [x] Done");
    ch.ack(msg);    
  }).end();
};

var pushToResponse = function(res) {
  var ok = ch.assertExchange(config.responseExchange);
  return ok.then(function() {
    
  });
};

amqp.connect(config.amqpUrl).then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  
  return conn.createChannel().then(function(ch) {    
    var ok = ch.assertQueue(config.requestQueue, {durable: true});
    ok = ok.then(function() {
      _(clients).forEach(function(client) {
        ch.bindQueue(config.requestQueue, 
                     config.requestExchange, 
                     client);
      });
      
      ch.prefetch(1); 
    });
    
    ok = ok.then(function() {
      ch.consume(config.requestQueue, doWork, {noAck: false});
      console.log(" [*] Waiting for messages. To exit press CTRL+C");
    });
    return ok;

    function doWork(msg) {
      send(msg, ch);
    }
  });
}).then(null, console.warn);
