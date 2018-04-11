const fs = require('fs');
const Q = require('q');
const axios = require("axios");
const jsonic = require("jsonic");
const CryptoJS = require("crypto-js");

const crypto = require("crypto");
const mdh = require("./mdh.js");
const mcodec = require("./mcodec.js");

const IP_CAMERA = "http://192.168.2.73"
const GENERATE_DH = "/ccm/cacs_dh_req.js?hfrom_handle=705790&dbnum_prime="+mdh.prime+"&droot_num="+mdh.g+"&dkey_a2b=%KEY_2AB%&dtid=0";
const LOGIN = "/ccm/cacs_login_req.js?hfrom_handle=%FROM_HANDLE%&dlid=%LID%&dnid=%NID%&duser=%USERNAME%&dpass=%PASSWORD%&dsession_req=1&dparam__x_countz_=1&dparam=1&dparam_name=spv&dparam_value=v1";
const LOGOUT = "/ccm/cacs_logout_req.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dnid=%NID%";
const PIC_GET = "/ccm/ccm_pic_get.jpg?hfrom_handle=887330&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dtoken=p0_xxxxxxxxxx";
const IMG_GET = "/ccm/ccm_img_get.js?hfrom_handle=%FROM_HANDLE%&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dtoken=vs0";
const MMQ_CREATE = "/ccm/mmq_create.js?hfrom_handle=%FROM_HANDLE%&dtimeout=30000";
const MMQ_PICK = "/ccm/mmq_pick.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dqid=%QID%&dtimeout=300000";
const SUBSCRIBE = "/ccm/ccm_subscribe.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dsess=1&dsess_nid=%NID%";
const INFO = "/ccm/ccm_info_get.js?hfrom_handle=639692&";
const STREAM = "/ccm/ccm_play.js?hfrom_handle=%FROM_HANDLE%&hqid=%QID%&dsess=1&dsess_nid=%NID%&dsess_sn=%USERNAME%&dsetup=1&dsetup_stream=RTP%5fUnicast&dsetup_trans=1&dsetup_trans_proto=rtsp&dtoken=p2";
var md5_ex = {
  hex: function (val) { 
    return crypto.createHash('md5').update(val,'latin1','latin1').digest('hex');
  }
};

function parseMessage(msg) {
	var tmp = msg.replace("message(","");
	tmp = tmp.substr(0, tmp.length - 2);
	return jsonic(tmp);
}
const priv = mdh.gen_private();
const pub = mdh.gen_public(priv);

function getInfo() {
  const url = IP_CAMERA + INFO;
  console.log(url);
  var deferred = Q.defer();
  axios
    .get(url)
    .then(response => {
      const resp = parseMessage(response.data);
      console.log(resp);
      deferred.resolve(resp);
  }).catch(error => {
    deferred.reject(error);
  });  
  return deferred.promise;
}

function subscribe(resp, sid, qid ,shared_key) {
  resp.to_handle++;
  console.log("qid="+qid+" shared_key="+shared_key);
  var nid = mcodec.nid(resp.to_handle, sid, shared_key, 0, null, null, md5_ex, "hex");
  const url = IP_CAMERA + SUBSCRIBE.replace("%FROM_HANDLE%",resp.to_handle).replace("%QID%",qid).replace("%NID%", nid);
  console.log(url);
  var deferred = Q.defer();
  axios
    .get(url)
    .then(response => {
      const resp = parseMessage(response.data);
      console.log(resp);
      deferred.resolve(resp);
  }).catch(error => {
    deferred.reject(error);
  });  
  return deferred.promise;
}

function stream(resp, user, sid, qid ,shared_key) {
  resp.to_handle++;
  var nid = mcodec.nid(resp.to_handle, sid, shared_key, 0, null, null, md5_ex, "hex");
  const url = IP_CAMERA + STREAM.replace("%FROM_HANDLE%",resp.to_handle).replace("%QID%",qid).replace("%NID%", nid).replace("%USERNAME%",user);
  console.log(url);
  var deferred = Q.defer();
  axios
    .get(url)
    .then(response => {
      const resp = parseMessage(response.data);
      console.log(resp);
      deferred.resolve(resp);
  }).catch(error => {
    deferred.reject(error);
  });  
  return deferred.promise;
}


function createMmq(resp) {
  resp.to_handle++;
  const url = IP_CAMERA + MMQ_CREATE.replace("%FROM_HANDLE%",resp.to_handle);
  console.log(url);
  var deferred = Q.defer();
  axios
    .get(url)
    .then(response => {
      const resp = parseMessage(response.data);
      console.log(resp);
      deferred.resolve(resp);
  }).catch(error => {
    deferred.reject(error);
  });  
  return deferred.promise;
}

function pickMmq(resp, qid) {
  resp.to_handle++;
  const url = IP_CAMERA + MMQ_PICK.replace("%FROM_HANDLE%",resp.to_handle).replace("%QID%",qid);
  console.log(url);
  var deferred = Q.defer();
  axios
    .get(url)
    .then(response => {
      const resp = parseMessage(response.data);
      console.log(resp);
      deferred.resolve(resp);
  }).catch(error => {
    deferred.reject(error);
  });  
  return deferred.promise;
}

function logout(from_handle, qid, sid, shared_key) {
  from_handle++;
  var nid = mcodec.nid(from_handle, sid, shared_key, 0, null, null, md5_ex, "hex");
  const url = IP_CAMERA + LOGOUT.replace("%FROM_HANDLE%",from_handle).replace("%QID%",qid).replace("%NID%", nid.replace(new RegExp('\\.', 'g'),"%"));
  console.log(url);
  var deferred = Q.defer();
  axios
    .get(url)
    .then(response => {
      const resp = parseMessage(response.data);
      console.log(resp);
      deferred.resolve(resp);
  }).catch(error => {
    deferred.reject(error);
  });  
  return deferred.promise;
}


function createImageConf(resp, sid, user, shared_key) {
  resp.to_handle++;
  console.log("shared_key="+shared_key+" sid="+sid);
  var nid = mcodec.nid(resp.to_handle, sid, shared_key, 0, null, null, md5_ex, "hex");
  const imgUrl = IP_CAMERA + IMG_GET.replace("%FROM_HANDLE%",resp.to_handle).replace("%NID%", nid).replace("%USERNAME%",user);
  console.log(imgUrl);
  var deferred = Q.defer();
  axios
    .get(imgUrl)
    .then(response => {
      const resp = parseMessage(response.data);
      console.log(resp);
      deferred.resolve(resp);
  }).catch(error => {
    deferred.reject(error);
  });  
  return deferred.promise;
}


function createSnapshot(resp, sid, user, shared_key) {
  resp.to_handle++;
  var nid = mcodec.nid(resp.to_handle, sid, shared_key, 0, null, null, md5_ex, "hex");
  const imgUrl = IP_CAMERA + PIC_GET.replace("%NID%", nid).replace("%USERNAME%",user);
  console.log(imgUrl);
  var deferred = Q.defer();
  axios
    .get(imgUrl, { responseType: 'arraybuffer', headers: {
      'Accept': 'image/jpeg',
    }})
    .then(response => {
      fs.writeFile("test.jpg", response.data,  "binary",function(err) {
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

function createPublicKey() {
  var deferred = Q.defer();
  axios
    .get(IP_CAMERA + GENERATE_DH.replace("%KEY_2AB%",pub))
    .then(response => {
      var obj = parseMessage(response.data);
      console.log(IP_CAMERA + GENERATE_DH.replace("%KEY_2AB%",pub),obj);
      const shared_key = mdh.gen_shared_secret(priv,obj.data.key_b2a);
      deferred.resolve({to_handle: obj.to_handle, shared_key : shared_key, lid:  obj.data.lid});
  }).catch(error => {
      deferred.reject(error);
  });
  return deferred.promise;
}

function login(obj, user, password) {
  obj.to_handle++;
  console.log(obj);
  var deferred = Q.defer();
  var nid = mcodec.nid(obj.to_handle, obj.lid, obj.shared_key, 2, null, null, md5_ex, "hex");
  console.log("nid="+nid+" shared_key="+obj.shared_key);
  var t = CryptoJS.MD5(password); 
  var c = CryptoJS.MD5(obj.shared_key),
      d = CryptoJS.enc.Hex.parse("0000000000000000");
  var enc_pass = CryptoJS.DES.encrypt(t, c, {
        iv: d,
        padding: CryptoJS.pad.NoPadding
    }).ciphertext.toString();
  const loginUrl = IP_CAMERA + LOGIN.replace("%FROM_HANDLE%",obj.to_handle).replace("%USERNAME%",user).replace("%LID%",obj.lid).replace("%NID%", nid).replace("%PASSWORD%",enc_pass);
  axios
    .get(loginUrl)
    .then(response => {
      var resp = parseMessage(response.data);
      console.log(loginUrl+" => ",resp);
      deferred.resolve(resp);
    })
    .catch(error => {
      deferred.reject(error);
    });  
  return deferred.promise;
}


var shared_key = null;
var sid = 0;
var lid = 0;
var qid = 0;
var username = "";
var from_handle = 0;
// Start program
getInfo().then( response => {
  username = response.data.sn;
  return createPublicKey();
}).then( publicReponse => {
  shared_key = publicReponse.shared_key;
  lid = publicReponse.lid;
  return login(publicReponse, username, "Snoopy20");
}).then( loginResponse => {
  sid = loginResponse.data.sid;
  return createMmq(loginResponse);
}).then( mmqResponse => {
  qid = mmqResponse.data.qid;
  return subscribe(mmqResponse, sid, mmqResponse.data.qid, shared_key);
}).then( subscribeResponse => {
  return createImageConf(subscribeResponse, sid, username, shared_key);
}).then( imageResponse => {
  from_handle = imageResponse.to_handle;
  return stream(imageResponse, username, sid, qid ,shared_key)
  // return createSnapshot(imageResponse, sid, username, shared_key);
})
//.then( snapshotResponse => {
//   logout(from_handle, qid, sid, username, shared_key);
// })
.catch( error => {
   console.log(error);
});