const socket = io();



let username = "";

let currentServer = null;

let currentRoom = null;

let currentVoiceRoom = null;


let localStream = null;

let peers = {};

let muted = false;





// =================
// LOGIN
// =================


window.onload = ()=>{


username =
prompt("Введите ник");



if(username){

socket.emit(
"login",
username
);


socket.emit(
"get-servers"
);


}



};









// =================
// SERVERS
// =================



function createServer(){


let name =
prompt(
"Название сервера"
);



if(name){

socket.emit(
"create-server",
name
);


setTimeout(()=>{

socket.emit(
"get-servers"
);

},500);


}


}







socket.on(
"servers",
(data)=>{


let box =
document.getElementById(
"servers"
);


box.innerHTML="";



data.forEach(server=>{


let btn =
document.createElement(
"button"
);



btn.innerHTML =
"🏠 "+server.name;



btn.onclick=()=>{


currentServer =
server.id;


socket.emit(
"get-rooms",
server.id
);



};



box.appendChild(btn);



});


});









// =================
// ROOMS
// =================



function createTextRoom(){


createRoom(
"text"
);


}




function createVoiceRoom(){


createRoom(
"voice"
);


}





function createRoom(type){


if(!currentServer){

alert(
"Сначала выбери сервер"
);

return;

}



let name =
prompt(
"Название комнаты"
);



if(name){


socket.emit(
"create-room",
{

server:currentServer,

name:name,

type:type

}

);



setTimeout(()=>{


socket.emit(
"get-rooms",
currentServer
);


},500);



}



}









socket.on(
"rooms",
(data)=>{


let box =
document.getElementById(
"rooms"
);



box.innerHTML="";



data.forEach(room=>{


let btn =
document.createElement(
"button"
);



if(room.type==="voice"){


btn.innerHTML =
"🔊 "+room.name;



btn.onclick=()=>{


currentVoiceRoom =
room.id;


document.getElementById(
"voiceRoom"
).innerHTML =
room.name;



};



}

else{


btn.innerHTML =
"💬 "+room.name;



btn.onclick=()=>{


currentRoom =
room.id;


currentVoiceRoom=null;


};


}



box.appendChild(btn);



});



});









// =================
// TEXT CHAT
// =================




function sendMessage(){


let input =
document.getElementById(
"message"
);



let text =
input.value;



if(!text)
return;



if(currentRoom){


socket.emit(
"room-message",
{

room:currentRoom,

text:text

}

);


}



input.value="";


}








socket.on(
"room-message",
(data)=>{


if(data.room==currentRoom){


addMessage(
data.user,
data.text,
data.time
);


}


});






function addMessage(
user,
text,
time
){


let box =
document.getElementById(
"messages"
);



let div =
document.createElement(
"div"
);



div.className="message";



div.innerHTML=

`
<b>${user}</b>

<br>

${text}

<br>

<small>${time}</small>

`;



box.appendChild(div);



box.scrollTop =
box.scrollHeight;


}









// =================
// ONLINE
// =================



socket.on(
"users",
(list)=>{


let box =
document.getElementById(
"users"
);



box.innerHTML="";



list.forEach(user=>{


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
// VOICE CHAT
// =================



async function joinVoice(){


if(!currentVoiceRoom){

alert(
"Выбери голосовую комнату"
);


return;

}



try{


localStream =
await navigator.mediaDevices
.getUserMedia({

audio:true

});



socket.emit(
"join-voice",
currentVoiceRoom
);



alert(
"🎤 Вы вошли в голос"
);



}

catch(e){


alert(
"Нет доступа к микрофону"
);


}



}









function leaveVoice(){



if(currentVoiceRoom){


socket.emit(
"leave-voice",
currentVoiceRoom
);


}



for(let id in peers){

peers[id].close();

}



peers={};



}





function muteMic(){



if(!localStream)
return;



muted=!muted;



localStream
.getAudioTracks()
.forEach(
track=>{

track.enabled =
!muted;

});


}









// новый пользователь



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
"offer",
{

target:id,

offer:offer

}

);



});









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
"ice",
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
"offer",
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
"answer",
{

target:data.from,

answer:answer

}

);



});









socket.on(
"answer",
async(data)=>{


if(peers[data.from]){


await peers[data.from]
.setRemoteDescription(
data.answer
);


}


});








socket.on(
"ice",
async(data)=>{


if(peers[data.from]){


await peers[data.from]
.addIceCandidate(
data.candidate
);


}


});








socket.on(
"voice-list",
(list)=>{


let box =
document.getElementById(
"voiceUsers"
);


box.innerHTML="";



list.forEach(id=>{


let p =
document.createElement(
"p"
);



p.innerHTML =
"🎤 "+id;



box.appendChild(p);



});


});
