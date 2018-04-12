class Camera {

    constructor(protocol, cameraIP, cameraPort) {
      this.Q = require('q');
      this.axios = require("axios");
      this.jsonic = require("jsonic");
      this.CryptoJS = require("crypto-js");
      this.fs = require('fs');
      this.crypto = require("crypto");
      this.mdh = require("./deps/mdh.js");
      this.mcodec = require("./deps/mcodec.js");

      this.IP_CAMERA = protocol+"://"+cameraIP+":"+cameraPort;
      this.GENERATE_DH = "/ccm/cacs_dh_req.js?hfrom_handle=%FROM_HANDLE%&dbnum_prime="+this.mdh.prime+"&droot_num="+this.mdh.g+"&dkey_a2b=%KEY_2AB%&dtid=0";
      this.LOGIN = "/ccm/cacs_login_req.js?hfrom_handle=%FROM_HANDLE%&dlid=%LID%&dnid=%NID%&duser=%USERNAME%&dpass=%PASSWORD%&dsession_req=1&dparam__x_countz_=1&dparam=1&dparam_name=spv&dparam_value=v1";
      this.LOGOUT = "/ccm/cacs_logout_req.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dnid=%NID%";
      this.PIC_GET = "/ccm/ccm_pic_get.jpg?hfrom_handle=887330&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dtoken=p1_xxxxxxxxxx";
      this.SNAPSHOT = "/ccm/ccm_snapshot.js?hfrom_handle=%FROM_HANDLE%&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dtoken=p1";
      this.SNAPSHOT_GET = "/ccm/ccm_pic_get.js?hfrom_handle=%FROM_HANDLE%&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dtoken=%TOKEN%";
      this.IMG_GET = "/ccm/ccm_img_get.js?hfrom_handle=%FROM_HANDLE%&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dtoken=vs0";
      this.MMQ_CREATE = "/ccm/mmq_create.js?hfrom_handle=%FROM_HANDLE%&dtimeout=30000";
      this.MMQ_PICK = "/ccm/mmq_pick.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dqid=%QID%&dtimeout=300000";
      this.SUBSCRIBE = "/ccm/ccm_subscribe.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dsess=1&dsess_nid=%NID%";
      this.INFO = "/ccm/ccm_info_get.js?hfrom_handle=639692&";
      this.STREAM = "/ccm/ccm_play.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dsetup=1&dsetup_stream=RTP%5fUnicast&dsetup_trans=1&dsetup_trans_proto=rtsp&dtoken=p2";
      this.privateKey = this.mdh.gen_private();
      this.publicKey = this.mdh.gen_public(this.privateKey);
      this.shared_key = null;
      this.md5_ex = {
        crypto : this.crypto,
        hex: function (val) { 
          return this.crypto.createHash('md5').update(val,'latin1','latin1').digest('hex');
        }
      };
      this.handle = 0;
      this.info = null;
      this.id = {
        sid :' 0x0',
        qid : 0,
        lid : '0x0'
      };
      this.isConnected = false;
    }

    isConnected() {
      return this.isConnected;
    }

    initialize() {
      this.handle = 705790;
    }

    nextHandle() {
      this.handle++;
    }

    generateNID(data, type) {
      return this.mcodec.nid(this.handle, data, this.shared_key, type, null, null, this.md5_ex, "hex");
    }

    parseMessage(msg) {
    	let tmp = msg.replace("message(","");
    	tmp = tmp.substr(0, tmp.length - 2);
    	return this.jsonic(tmp);
    }

    generateUrl(type) {
      this.nextHandle();
      let url = this.IP_CAMERA;
      let nid = "";
      switch(type) {
        case "INFO" :
          url += this.INFO.replace("%FROM_HANDLE%",this.handle);
          break;
        case "LOGIN":
          nid = this.generateNID(this.id.lid, 2);
          url += this.LOGIN.replace("%FROM_HANDLE%",this.handle).replace("%USERNAME%",this.info.sn).replace("%LID%",this.id.lid).replace("%NID%", nid);
          break;
        case "LOGOUT":
          nid = this.generateNID(this.id.sid, 0);
          url += this.LOGOUT.replace("%FROM_HANDLE%",this.handle).replace("%QID%",this.id.qid).replace("%NID%", nid);
          break;
        case "GENERATE_DH":
          url += this.GENERATE_DH.replace("%FROM_HANDLE%",this.handle).replace("%KEY_2AB%",this.publicKey);
          break;
        case "SUBSCRIBE":
          nid = this.generateNID(this.id.sid, 0);
          url += this.SUBSCRIBE.replace("%FROM_HANDLE%",this.handle).replace("%QID%",this.id.qid).replace("%NID%", nid);
          break;
        case "STREAM":
          nid = this.generateNID(this.id.sid, 0);
          url += this.STREAM.replace("%FROM_HANDLE%",this.handle).replace("%QID%",this.id.qid).replace("%NID%", nid).replace("%USERNAME%",this.info.sn);
          break;
        case "MMQ_CREATE":
          url += this.MMQ_CREATE.replace("%FROM_HANDLE%",this.handle);
          break;
        case "MMQ_PICK":
          url += this.MMQ_PICK.replace("%FROM_HANDLE%",this.handle).replace("%QID%",this.id.qid);
          break;
        case "GET_IMG_CONF":
          nid = this.generateNID(this.id.sid, 0);
          url += this.IMG_GET.replace("%FROM_HANDLE%",this.handle).replace("%NID%", nid).replace("%USERNAME%",this.info.sn);
          break;
        case "CREATE_PIC":
          nid = this.generateNID(this.id.sid, 0);
          url += this.PIC_GET.replace("%NID%", nid).replace("%USERNAME%",this.info.sn);
          break;
        case "CREATE_SNAPSHOT":
          nid = this.generateNID(this.id.sid, 0);
          url += this.SNAPSHOT.replace("%FROM_HANDLE%",this.handle).replace("%NID%", nid).replace("%USERNAME%",this.info.sn);
          break;
        case "GET_SNAPSHOT":
          nid = this.generateNID(this.id.sid, 0);
          url += this.SNAPSHOT_GET.replace("%FROM_HANDLE%",this.handle).replace("%NID%", nid).replace("%USERNAME%",this.info.sn);
          break;
      }
      console.log(url);
      return url;
    }

    getInfo() {
      if (this.info == null) {
        const url = this.generateUrl("INFO");
        const deferred = this.Q.defer();
        this.axios
          .get(url)
          .then(response => {
            const resp = this.parseMessage(response.data);
            this.info = resp.data;
            deferred.resolve(resp);
        }).catch(error => {
          deferred.reject(error);
        });  
        return deferred.promise;
      } else {
        return this.info;
      }
    }

    subscribe() {
      const url = this.generateUrl("SUBSCRIBE");
      const deferred = this.Q.defer();
      this.axios
        .get(url)
        .then(response => {
          const resp = this.parseMessage(response.data);
          deferred.resolve(resp);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }

    stream() {
      const url = this.generateUrl("STREAM");
      const deferred = this.Q.defer();
      this.axios
        .get(url)
        .then(response => {
          const resp = this.parseMessage(response.data);
          deferred.resolve(resp);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }


    createMmq() {
      const url = this.generateUrl("MMQ_CREATE");
      const deferred = this.Q.defer();
      this.axios
        .get(url)
        .then(response => {
          const resp = this.parseMessage(response.data);
          this.id.qid = resp.data.qid;
          deferred.resolve(resp);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }

    pickMmq() {
      const url = this.generateUrl("MMQ_PICK");
      const deferred = Q.defer();
      this.axios
        .get(url)
        .then(response => {
          const resp = this.parseMessage(response.data);
          deferred.resolve(resp);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }

    logout() {
      const url = this.generateUrl("LOGOUT");
      const deferred = this.Q.defer();
      this.axios
        .get(url)
        .then(response => {
          const resp = this.parseMessage(response.data);
          this.isConnected = true;
          deferred.resolve(resp);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }


    getImageConf() {
      const imgUrl = this.generateUrl("GET_IMG_CONF");
      const deferred = this.Q.defer();
      this.axios
        .get(imgUrl)
        .then(response => {
          const resp = this.parseMessage(response.data);
          deferred.resolve(resp);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }


    getPicture() {
      const imgUrl = this.generateUrl("CREATE_PIC");
      const deferred = this.Q.defer();
      this.axios
        .get(imgUrl, { responseType: 'arraybuffer', headers: {
          'Accept': 'image/jpeg',
        }})
        .then(response => {
          deferred.resolve(response.data);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }

    createSnapshot() {
      const imgUrl = this.generateUrl("CREATE_SNAPSHOT");
      const deferred = this.Q.defer();
      this.axios
        .get(imgUrl)
        .then(response => {
          const resp = this.parseMessage(response.data);
          console.log(resp);          
          this.getSnapshot(resp.data.token).then(result => {
            deferred.resolve(result);            
          }).catch(error => {
            deferred.reject(error);
          });
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }

    getSnapshot(token) {
      const imgUrl = this.generateUrl("GET_SNAPSHOT").replace("%TOKEN%",token);
      const deferred = this.Q.defer();
      this.axios
        .get(imgUrl)
        .then(response => {
          const obj = this.parseMessage(response.data);
          this.fs.writeFile("test.jpg", Buffer.from(obj.data.frame, 'base64'),  "binary",function(err) {
              if(err) {
                  console.log(err);
              } else {
                  console.log("The file was saved!");
              }
          });
          deferred.resolve(response.data);
      }).catch(error => {
        deferred.reject(error);
      });  
      return deferred.promise;
    }

    generateSharedKey() {
      const deferred = this.Q.defer();
      this.axios
        .get(this.generateUrl("GENERATE_DH"))
        .then(response => {
          const obj = this.parseMessage(response.data);
          this.shared_key = this.mdh.gen_shared_secret(this.privateKey,obj.data.key_b2a);
          this.id.lid = obj.data.lid;
          deferred.resolve(obj);
      }).catch(error => {
          deferred.reject(error);
      });
      return deferred.promise;
    }

    login(password) {
      const deferred = this.Q.defer();
      const md5_pass = this.CryptoJS.MD5(password); 
      const md5_key = this.CryptoJS.MD5(this.shared_key);
      const iv_init = this.CryptoJS.enc.Hex.parse("0000000000000000");

      const enc_pass = this.CryptoJS.DES.encrypt(md5_pass, md5_key, {
            iv: iv_init,
            padding: this.CryptoJS.pad.NoPadding
        }).ciphertext.toString();
      const loginUrl = this.generateUrl("LOGIN").replace("%PASSWORD%",enc_pass);
      this.axios
        .get(loginUrl)
        .then(response => {
          const resp = this.parseMessage(response.data);
          this.id.sid = resp.data.sid;
          this.isConnected = true;
          deferred.resolve(resp);
        })
        .catch(error => {
          deferred.reject(error);
        });  
      return deferred.promise;
    }
}

module.exports = Camera;
