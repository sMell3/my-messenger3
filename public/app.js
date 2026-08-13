const socket = io();



let username = "";

let currentServer = null;

let currentRoom = null;







// ======================
// ВХОД
// ======================


window.onload = ()=>{


username = prompt(
"Введите ник"
);



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









// ======================
// СОЗДАНИЕ СЕРВЕРА
// ======================


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









// ======================
// СПИСОК СЕРВЕРОВ
// ======================


socket.on(
"servers",
(data)=>{


let box =
document.getElementById(
"servers"
);



box.innerHTML="";



data.forEach(server=>{


let button =
document.createElement(
"button"
);



button.innerHTML =
"🎮 "+server.name;



button.onclick=()=>{


currentServer =
server.id;



socket.emit(
"get-rooms",
server.id
);



};



box.appendChild(button);



});



});









// ======================
// ПОИСК СЕРВЕРОВ
// ======================



function searchServers(){


document
.getElementById(
"serverWindow"
)
.style.display="flex";



socket.emit(
"search-servers"
);



}









socket.on(
"all-servers",
(data)=>{


let box =
document.getElementById(
"allServers"
);



box.innerHTML="";



data.forEach(server=>{


let div =
document.createElement(
"div"
);



div.className =
"found-server";



div.innerHTML =

`

<span>
🎮 ${server.name}
</span>


<button onclick="joinServer(${server.id})">

Войти

</button>

`;



box.appendChild(div);



});



});









function joinServer(id){


currentServer=id;



socket.emit(
"get-rooms",
id
);



closeServers();



}








function closeServers(){


document
.getElementById(
"serverWindow"
)
.style.display="none";


}









// ======================
// КОМНАТЫ
// ======================



function createRoom(){


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

type:"text"

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


let button =
document.createElement(
"button"
);



button.innerHTML =
"💬 "+room.name;



button.onclick=()=>{


currentRoom =
room.id;



document
.getElementById(
"messages"
)
.innerHTML="";


};



box.appendChild(button);



});



});









// ======================
// СООБЩЕНИЯ
// ======================



function sendMessage(){


let input =
document.getElementById(
"message"
);



let text =
input.value.trim();



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



div.className =
"message";



div.innerHTML =

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









// ======================
// ОНЛАЙН
// ======================



socket.on(
"users",
(data)=>{


let box =
document.getElementById(
"users"
);



box.innerHTML="";



data.forEach(user=>{


let p =
document.createElement(
"p"
);



p.innerHTML =
"🟢 "+user;



box.appendChild(p);



});



});
