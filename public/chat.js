var socket = io.connect("http://localhost:8082");
var vChatLoby = document.getElementById('video-chat-lobby');
var vChat = document.getElementById('video-chat-room');
var joinB = document.getElementById('join');
var uVid = document.getElementById('user-video');
var sVid = document.getElementById('screen-video');
var pVid = document.getElementById('peer-video');
var rName = document.getElementById('roomName');
var creatr = false;
var rtcPeerConn;
var globalStream;

//ceate ice server to accept stun server
var iceServers = {
    iceServers:[ 
    { urls: "stun:stun.services.mozilla.com" }, //stun: is very important
    { urls: "stun:stun.l.google.com:19302" }, //stun: is very important
]};

joinB.addEventListener('click',function(){
    if(rName.value==""){
        alert('Please enter roomname');
    }else{
        socket.emit("join",rName.value);     
    }
});



socket.on("letJoin", (stat) => {
    
    if(stat=="full"){
        alert("room is full");
    }else{
        var alt = "";
        if(stat=="created"){ creatr = true; alt = "Congratulations! room created"; }
        else if(stat=="joined"){ alt = "Congratulations! Joined room"; }
        alert(alt);
        //start screencapture
        var displayMediaOptions = {
            video: {
            cursor: "always"
            },
        };
        
        //end screen capture

        var constraints = { audio: true, video: { width: 200, height: 150 } };
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
          /* use the stream */
            globalStream = stream;
            vChatLoby.style = 'display:none';   
            uVid.srcObject = stream;
            uVid.onloadedmetadata = function (e){
                uVid.play();
            };
            (stat=="joined") ? socket.emit("ready",rName.value) : "";
        })
        .catch(function(err) {
          /* handle the error */
          alert('could not access user media');
        });            
    }
});

socket.on("ready",() => {
    if(creatr){
        rtcPeerConn = new RTCPeerConnection(iceServers);
        rtcPeerConn.onicecandidate = OnIceCandidateFunction;
        rtcPeerConn.ontrack = OnTrackFunction;
        rtcPeerConn.addTrack(globalStream.getTracks()[0],globalStream); //for audio
        rtcPeerConn.addTrack(globalStream.getTracks()[1],globalStream); //for video
        
        rtcPeerConn.createOffer().then(function(offer) {
            rtcPeerConn.setLocalDescription(offer);
            socket.emit("offer", offer, rName);
          })
          .catch(function(reason) {
              console.log(reason);
            // An error occurred, so handle the failure to connect
          });

    }   
});


  socket.on("candidate", function (candidate) {
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConn.addIceCandidate(icecandidate);
  });


socket.on("offer",function (offer)  {
    if(!creatr){
        rtcPeerConn = new RTCPeerConnection(iceServers);
        rtcPeerConn.onicecandidate = OnIceCandidateFunction;
        rtcPeerConn.ontrack = OnTrackFunction;
        rtcPeerConn.addTrack(globalStream.getTracks()[0],globalStream); //for audio
        rtcPeerConn.addTrack(globalStream.getTracks()[1],globalStream); //for video
        rtcPeerConn.setRemoteDescription(offer);
        rtcPeerConn.createAnswer().then((answer) => {
            rtcPeerConn.setLocalDescription(answer);
            socket.emit("answer", answer, rName);
          })
          .catch(function(reason) {
              console.log(reason);
            // An error occurred, so handle the failure to connect
          });

    }   
});

socket.on("answer", function (answer) {
    rtcPeerConn.setRemoteDescription(answer);
});

function OnIceCandidateFunction(event){
    if(event.candidate){
        socket.emit("candidate",event.candidate,rName);
    }
}

function OnTrackFunction(event){
    pVid.srcObject = event.streams[0];
    pVid.onloadedmetadata = function(e){
        pVid.play();
    }
}