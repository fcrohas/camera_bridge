// HTTP server configuration
const express = require('express')
const app = express()

// Camera configuration
const Camera = require('./mipc/camera');

let camera = null;
// Base url
app.get('/live', function (req, res) {
  if (camera == null) {
    res.send('No camera defined');
    return;
  } else {
    camera.createSnapshot().then( response => {
       res.writeHead(200, {'Content-Type': 'image/jpeg' });
       res.end(response, 'binary');
    }).catch(error => {
      res.send(error);
    });
  }
});

app.listen(3000, function () {
  camera = new Camera("http","192.168.2.73","80");
  camera.initialize();
  console.log('Starting camera bridge!')
  // Start program
  camera.getInfo().then( response => {
    console.log(response);
    return camera.generateSharedKey();
  }).then( publicReponse => {
    console.log(publicReponse);
    return camera.login( "Snoopy20");
  }).then( loginResponse => {
    console.log(loginResponse);
    return camera.createMmq();
  }).then( mmqResponse => {
    console.log(mmqResponse);
    return camera.subscribe();
  }).then( subscribeResponse => {
    console.log(subscribeResponse);
    return camera.getImageConf();
  });
});
