### Configuration

 In `config.json` file :

Parameter|Description
---------|-----------
cameraIP|The camera ip address on local area network
proxyPort|The RTSP port used on camera that is also mirrored on proxy
url|The camera http url to website camera ( http://<CAMERA_IP>:80 )
camid|The camera name seen on webinterface as login
password|The password on the camera login form
profile|The profile correponding to picture size p0 to p3

Profile|size
-------|----
p0|1280x720
p1|640x360
p2|320x180
p3|160x90

### Installation and Startup

 ````bash
 npm install
 node proxy.js
 ````

### Usage

 With ZoneMinder simply create a camera with source type set to `FFMPEG`.
 Connection method is TCP
 And in source URL :

	rtmp://<PROXY_IP>:<PROXY_PORT>/live/<CAMERA_NAME>_<CAMERA_PROFILE>_XXXXXXXXXXXX

 CAMERA_PROFILE should be the same setup in `config.json` like follow :

### Raspberry PI 3

 To work with zoneminder on Raspberry PI 3. You need to find the procedure to install phantom JS yourself and also FFMPEG need to be build with support of librtmp.

 To check if FFMPEG support librtmp do `ffmpeg -protocols`
 It should return a list of protocols plus `rtmp ,rtmpe, rtmps, rtmpt, rtmpte`
