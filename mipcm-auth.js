const StringDecoder = require('string_decoder').StringDecoder
const phantom = require('phantom')
const axios = require('axios')
const jsonic = require('jsonic')
const fs = require('fs')
const Sync = require('sync')

class MipcAuth {

  constructor() {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    this.decoder = new StringDecoder('utf8');
    this.baseToken = Buffer.from('XXXXXXXXXXXX','utf8')
    this.newToken  = Buffer.from('XXXXXXXXXXXX','utf8')
    this.config = JSON.parse(fs.readFileSync("./config.json", 'utf8'))
    this.urlcapture = '';
    this.rtmp = "/ccm/ccm_play.js?hfrom_handle=%HANDLE%&hqid=%HQID%&dsess=1&dsess_nid=%NID%&dsess_sn="+this.config.camid+"&dsetup=1&dsetup_stream=RTP%5fUnicast&dsetup_trans=1&dsetup_trans_proto=rtmp&dtoken="+this.config.profile
    Sync(()=> {
      this.getSessionNid()
    })
  }

  log(title, msg) {
    console.log('[' + (new Date()).toISOString().replace('T', ' ').replace('Z', '') + '][' + title + '] ' + msg)
  }

  parseMessage(msg) {
    let tmp = msg.replace("message(","");
    tmp = tmp.substr(0, tmp.length - 2);
    return jsonic(tmp);
  }

  async getSessionNid() {
    try {
      const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=true', '--web-security=false'])
      const page = await instance.createPage()
      await page.property('viewportSize', {
        width: 1920,
        height: 1080
      })
      const status = await page.open(this.config.url)
      if (status === "success") {
        //page.render("page.png");
        await page.on('onResourceRequested', (requestData)=> {
          //console.info('Requesting', requestData.url.substr(0,250))
          if (requestData.url.indexOf('ccm_misc_get') > -1) {
            this.urlcapture = requestData.url
            this.log('URLCAPTURE', this.urlcapture)
      	    this.configureRTMP()
            instance.exit()
          }
        });
        await page.evaluate(function(config) {
          document.getElementById("signin_name").value = config.camid
          document.getElementById("signin_show_pw").value = config.password
          document.getElementById("signin_pw").value = config.password
          document.getElementById("sign_in").click()
          //on emule un clic sur le bouton de capture
          setTimeout(function() {
            document.getElementById('camera_off_pic').click();
          }, 5000)
        }, this.config)
      }
      //instance.exit()
    } catch (e) {
      console.error(e)
    }
  }

  reInit() {
    Sync(()=> {
      this.getSessionNid()
    })
  }

  configureRTMP() {
     var urlparams = this.urlcapture.substring(this.urlcapture.indexOf('?'))
     console.log('Url params:',urlparams)
     // get params
     var params = urlparams.split('&')
     var dsess_nid = ''
     var hqid = ''
     var handle = ''
     params.forEach(function(element) {
       if (element.indexOf('dsess_nid') > -1) {
         var data = element.split('=')
         dsess_nid = data[1]
       }
       if (element.indexOf('hqid') > -1) {
         var data = element.split('=')
         hqid = data[1]
       }
       if (element.indexOf('hfrom_handle') > -1) {
         var data = element.split('=')
         handle = data[1] * 1 + 1
       }
     })
     this.log('RTMP URL', this.config.url + this.rtmp.replace('%NID%',dsess_nid).replace('%HANDLE%',handle).replace('%HQID%',hqid))
     var request = axios.get(this.config.url + this.rtmp.replace('%NID%',dsess_nid).replace('%HANDLE%',handle).replace('%HQID%',hqid)).then( response => {
         var json = this.parseMessage(response.data)
         this.log('RTMP URI', json.data.uri.url)
         // -i rtmp://192.168.2.135:88/videoMain -s 640x480 -b:v 512k -c:v copy -f hls -hls_time 2 -hls_playlist_type event -c:a aac -b:a 128k -ac 2 /var/www/html/mpeg-dash/video.m3u8
         const token = json.data.uri.url.substring(json.data.uri.url.indexOf(this.config.profile+'_')+3)
         this.log('TOKEN', token)
         this.newToken  = Buffer.from(token,'utf8')
     }).catch(error => {
      console.log(error)
     })
  }
}

module.exports = MipcAuth
