'use strict';
const net = require('net');
const MipcAuth = require('./mipcm-auth.js')
const FilterAuth = require('./filter-auth.js')
const jsonic = require('jsonic')
const fs = require('fs')
// Prepare
const mipc = new MipcAuth();
const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'))

// proxy server
const proxy = net.createServer(function (socket) {
    let client;
    const filterAuthenticator = new FilterAuth(mipc)

    console.log('Client connected to proxy');

    // Create a new connection to the TCP server
    client = net.connect(config.proxyPort,config.cameraIP);

    // 2-way pipe between client and TCP server
    socket.pipe(filterAuthenticator).pipe(client).pipe(socket);

    socket.on('close', function () {
        console.log('Client disconnected from proxy');
	mipc.reInit()
    });

    socket.on('error', function (err) {
        console.log('Error: ' + err.toString());
    });
});

proxy.listen(config.proxyPort);
console.log('Proxy listening');
