const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();


const app = express();

app.use(cors());


const publicPath =
path.join(__dirname,"public");


app.use(express.static(publicPath));



app.get("/",(req,res)=>{

res.sendFile(
path.join(publicPath,"index.html")
);

});



const server =
http.createServer(app);



const io =
new Server(server,{
cors:{
origin:"*"
}
});





// DATABASE


const db =
new sqlite3.Database(
"messenger.db"
);



db.serialize(()=>{


db.run(`
CREATE TABLE IF NOT EXISTS users(
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT UNIQUE
)
`);



db.run(`
CREATE TABLE IF NOT EXISTS servers(
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT
)
`);




db.run(`
CREATE TABLE IF NOT EXISTS rooms(
id INTEGER PRIMARY KEY AUTOINCREMENT,
server_id INTEGER,
name TEXT,
type TEXT
)
`);




db.run(`
CREATE TABLE IF NOT EXISTS messages(
id INTEGER PRIMARY KEY AUTOINCREMENT,
room_id INTEGER,
user TEXT,
text TEXT,
time TEXT
)
`);



});






let users = {};

let voiceRooms = {};







io.on("connection",(socket)=>{





// LOGIN


socket.on(
"login",
(name)=>{


users[socket.id]=name;


socket.emit(
"login-success",
name
);



io.emit(
"users",
Object.values(users)
);


});







// SERVERS



socket.on(
"get-servers",
()=>{


db.all(
"SELECT * FROM servers",
[],
(err,rows)=>{


socket.emit(
"servers",
rows
);


});


});






socket.on(
"create-server",
(name)=>{


db.run(
`
INSERT INTO servers(name)
VALUES(?)
`,
[name]
);



});


 









// ROOMS



socket.on(
"create-room",
(data)=>{


db.run(
`
INSERT INTO rooms
(server_id,name,type)

VALUES(?,?,?)

`,
[
data.server,
data.name,
data.type
]
);


});






socket.on(
"get-rooms",
(server)=>{


db.all(
`
SELECT *
FROM rooms
WHERE server_id=?

`,
[
server
],

(err,rows)=>{


socket.emit(
"rooms",
rows
);


});


});









// TEXT CHAT



socket.on(
"room-message",
(data)=>{


let user =
users[socket.id] || "User";


let time =
new Date()
.toLocaleTimeString();



io.emit(
"room-message",
{

room:data.room,

user:user,

text:data.text,

time:time

}

);


});









// ======================
// VOICE ROOMS
// ======================



socket.on(
"join-voice",
(room)=>{


if(!voiceRooms[room]){

voiceRooms[room]=[];

}



voiceRooms[room].push(
socket.id
);



socket.join(
"voice-"+room
);




socket.to(
"voice-"+room
)
.emit(
"voice-user",
socket.id
);




io.to(
"voice-"+room
)
.emit(
"voice-list",
voiceRooms[room]
);



});









socket.on(
"leave-voice",
(room)=>{


if(voiceRooms[room]){


voiceRooms[room] =
voiceRooms[room]
.filter(
id=>id!==socket.id
);


}



socket.leave(
"voice-"+room
);



io.to(
"voice-"+room
)
.emit(
"voice-list",
voiceRooms[room] || []
);



});









// WEBRTC



socket.on(
"offer",
(data)=>{


io.to(data.target)
.emit(
"offer",
{
from:socket.id,
offer:data.offer
}
);


});






socket.on(
"answer",
(data)=>{


io.to(data.target)
.emit(
"answer",
{
from:socket.id,
answer:data.answer
}
);


});






socket.on(
"ice",
(data)=>{


io.to(data.target)
.emit(
"ice",
{
from:socket.id,
candidate:data.candidate
}
);


});









socket.on(
"disconnect",
()=>{


delete users[socket.id];


for(let room in voiceRooms){


voiceRooms[room] =
voiceRooms[room]
.filter(
id=>id!==socket.id
);


}



io.emit(
"users",
Object.values(users)
);



});





});






const PORT =
process.env.PORT || 3000;



server.listen(
PORT,
()=>{

console.log(
"SERVER STARTED",
PORT
);

});
