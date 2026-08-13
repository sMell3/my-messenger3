const socket = io();


let nickname = "";

let localStream = null;

let peers = {};




// =================
// ВХОД
// =================


function join(){


    nickname =
    document.getElementById("nickname").value.trim();



    if(!nickname){

        alert("Введите ник");

        return;

    }



    socket.emit(
        "join",
        nickname
    );



    document.getElementById(
        "login"
    ).style.display="none";



    document.getElementById(
        "chat"
    ).style.display="block";


}








// =================
// ЧАТ
// =================



function sendMessage(){


    let input =
    document.getElementById("message");


    let text =
    input.value.trim();



    if(!text)
        return;



    socket.emit(
        "sendMessage",
        text
    );



    input.value="";


}







document
.getElementById("message")
.addEventListener(
"keydown",
(e)=>{


if(e.key==="Enter"){

sendMessage();

}


});








socket.on(
"message",
(data)=>{


addMessage(data);


});






function addMessage(data){


let box =
document.getElementById(
"messages"
);



let div =
document.createElement(
"div"
);



div.className="message";



div.innerHTML=`

<b>${data.user}</b><br>

${data.text}

<small>
${data.time || ""}
</small>

`;



box.appendChild(div);



box.scrollTop =
box.scrollHeight;


}









socket.on(
"history",
(list)=>{


list.forEach(
msg=>{

addMessage(msg);

}

);


});










socket.on(
"onlineUsers",
(list)=>{


let box =
document.getElementById(
"online"
);



box.innerHTML="";



list.forEach(
user=>{


let p =
document.createElement(
"p"
);


p.innerHTML =
"🟢 "+user;


box.appendChild(p);


});


});









// =================
// ГОЛОСОВОЙ ЧАТ
// =================




async function startVoice(){



if(localStream){

return;

}



try{


localStream =
await navigator.mediaDevices
.getUserMedia({

audio:true

});



socket.emit(
"voice-join"
);



alert(
"🎤 Микрофон включён"
);



}

catch(e){


alert(
"Нет доступа к микрофону"
);


console.log(e);


}



}









function createPeer(id){


let peer =
new RTCPeerConnection({

iceServers:[

{

urls:
"stun:stun.l.google.com:19302"

}

]

});



peers[id]=peer;






if(localStream){


localStream
.getTracks()
.forEach(
track=>{


peer.addTrack(
track,
localStream
);


});

}



peer.onicecandidate =
(e)=>{


if(e.candidate){


socket.emit(
"ice-candidate",
{

target:id,

candidate:e.candidate

}

);


}


};






peer.ontrack =
(e)=>{


let audio =
document.createElement(
"audio"
);


audio.autoplay=true;


audio.srcObject =
e.streams[0];


document.body.appendChild(
audio
);


};



return peer;


}









socket.on(
"voice-user",
async(id)=>{


let peer =
createPeer(id);



let offer =
await peer.createOffer();



await peer.setLocalDescription(
offer
);



socket.emit(
"voice-offer",
{

target:id,

offer:offer

}

);



});









socket.on(
"voice-offer",
async(data)=>{


let peer =
createPeer(
data.from
);



await peer.setRemoteDescription(
data.offer
);



let answer =
await peer.createAnswer();



await peer.setLocalDescription(
answer
);



socket.emit(
"voice-answer",
{

target:data.from,

answer:answer

}

);



});









socket.on(
"voice-answer",
async(data)=>{


let peer =
peers[data.from];



if(peer){


await peer.setRemoteDescription(
data.answer
);


}


});









socket.on(
"ice-candidate",
async(data)=>{


let peer =
peers[data.from];



if(peer){


await peer.addIceCandidate(
data.candidate
);


}


});








function muteVoice(){


if(!localStream)
return;



localStream
.getAudioTracks()
.forEach(
track=>{


track.enabled =
!track.enabled;


});


}
