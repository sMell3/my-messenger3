const socket = io();



let username = "";

let currentRoom = null;

let currentServer = null;

let privateUser = null;





// ======================
// ВХОД
// ======================


window.onload = ()=>{


username =
prompt("Введите ник");



if(username){


socket.emit(
"login",
username
);


}



};









// ======================
// СЕРВЕРЫ
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


}


}





socket.emit(
"get-servers"
);





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









// ======================
// КОМНАТЫ
// ======================



function createRoom(){



if(!currentServer){

alert(
"Выбери сервер"
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

name:name

}

);


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



btn.innerHTML =
"# "+room.name;



btn.onclick=()=>{


currentRoom =
room.id;



privateUser=null;



loadRoom();


};



box.appendChild(btn);



});


});









// ======================
// СООБЩЕНИЯ КОМНАТ
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





if(privateUser){



socket.emit(
"private-message",
{

from:username,

to:privateUser,

text:text

}

);



}



else if(currentRoom){



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


if(
data.room ==
currentRoom
){


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

<small>
${time}
</small>

`;



box.appendChild(div);



box.scrollTop =
box.scrollHeight;


}









function loadRoom(){


document.getElementById(
"messages"
).innerHTML="";


}









// ======================
// ПОЛЬЗОВАТЕЛИ / ЛС
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


if(user==username)
return;



let btn =
document.createElement(
"button"
);



btn.innerHTML =
"💬 "+user;



btn.onclick=()=>{


privateUser=user;

currentRoom=null;


document.getElementById(
"messages"
).innerHTML="";



socket.emit(
"get-private",
{

from:username,

to:user

}

);



};



box.appendChild(btn);



});


});









// история ЛС


socket.on(
"private-history",
(data)=>{


document.getElementById(
"messages"
).innerHTML="";



data.forEach(msg=>{


addMessage(
msg.sender,
msg.text,
msg.time
);



});


});









// новые ЛС


socket.on(
"private-message",
(data)=>{


if(

(data.from==username &&
data.to==privateUser)

||

(data.to==username &&
data.from==privateUser)

){


addMessage(
data.from,
data.text,
data.time
);


}



});
