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


app.use(
    express.static(publicPath)
);



app.get("/",(req,res)=>{

    res.sendFile(
        path.join(
            publicPath,
            "index.html"
        )
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





// ===== БАЗА =====


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
name TEXT
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




db.run(`
CREATE TABLE IF NOT EXISTS private_messages(
id INTEGER PRIMARY KEY AUTOINCREMENT,
sender TEXT,
receiver TEXT,
text TEXT,
time TEXT
)
`);



});







let online = {};







io.on("connection",(socket)=>{



console.log(
"User connected",
socket.id
);





// ===== ВХОД =====


socket.on(
"login",
(name)=>{


online[socket.id]=name;



db.run(
`
INSERT OR IGNORE INTO users(name)
VALUES(?)
`,
[name]
);



socket.emit(
"login-success",
name
);



io.emit(
"users",
Object.values(online)
);



});









// ===== СЕРВЕРЫ =====



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



loadServers(socket);


});







socket.on(
"get-servers",
()=>{


loadServers(socket);


});






function loadServers(socket){


db.all(
`
SELECT *
FROM servers
`,
[],
(err,rows)=>{


socket.emit(
"servers",
rows
);


});


}








// ===== КОМНАТЫ =====



socket.on(
"create-room",
(data)=>{


db.run(
`
INSERT INTO rooms(server_id,name)
VALUES(?,?)
`,
[
data.server,
data.name
]
);



loadRooms(
socket,
data.server
);


});








socket.on(
"get-rooms",
(server)=>{


loadRooms(
socket,
server
);


});






function loadRooms(socket,server){


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


}









// ===== СООБЩЕНИЯ КОМНАТ =====




socket.on(
"room-message",
(data)=>{


let user =
online[socket.id] || "User";


let time =
new Date()
.toLocaleTimeString();




db.run(
`
INSERT INTO messages
(room_id,user,text,time)

VALUES(?,?,?,?)
`,
[
data.room,
user,
data.text,
time
]
);




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









// ===== ЛИЧНЫЕ СООБЩЕНИЯ =====




socket.on(
"private-message",
(data)=>{


let time =
new Date()
.toLocaleTimeString();



db.run(
`
INSERT INTO private_messages

(sender,receiver,text,time)

VALUES(?,?,?,?)
`,
[
data.from,
data.to,
data.text,
time
]
);





io.emit(
"private-message",
{

from:data.from,

to:data.to,

text:data.text,

time:time

}
);



});









socket.on(
"get-private",
(data)=>{


db.all(
`
SELECT *
FROM private_messages

WHERE
(sender=? AND receiver=?)

OR

(sender=? AND receiver=?)

`,
[
data.from,
data.to,
data.to,
data.from
],

(err,rows)=>{


socket.emit(
"private-history",
rows
);


});


});









// ===== ОТКЛЮЧЕНИЕ =====



socket.on(
"disconnect",
()=>{


delete online[socket.id];



io.emit(
"users",
Object.values(online)
);



});


});








const PORT =
process.env.PORT || 3000;



server.listen(
PORT,
()=>{

console.log(
"Server running on",
PORT
);

});
