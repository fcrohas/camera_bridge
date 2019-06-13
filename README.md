### Configuration ###
	In `config.json` file :

  cameraIP The camera ip address on local area network
  proxyPort The RTSP port used on camera that is also mirrored on proxy
  url The camera http url to website camera ( http://<CAMERA_IP>:80 )
  camid The camera name seen on webinterface as login
  password The password on the camera login form
  profile The profile correponding to picture size p0 to p3


### Installation and Startup ###

 ` npm install
 ` node proxy.js

### Usage ###

 With ZoneMinder simply create a camera with source type set to `FFMPEG`.
 Connection method is TCP
 And in source URL :
    rtmp://<PROXY_IP>:7010/live/<CAMERA_NAME>_<CAMERA_PROFILE>_XXXXXXXXXXXX

 CAMERA_PROFILE should be the same setup in config.json file between p0 to p3.

 For example p1 is 640x360

### Raspberry PI 3 ###

 To work with zoneminder on Raspberry PI 3. You need to find the procedure to install phantom JS yourself and also FFMPEG need to be build with support of librtmp.

 To check if FFMPEG support librtmp do `ffmpeg -protocols`
 It should return a list of protocols plus   rtmp ,rtmpe, rtmps, rtmpt, rtmpte
