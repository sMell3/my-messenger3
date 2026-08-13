const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();


const app = express();

app.use(cors());


const publicPath = path.join(__dirname,"public");

app.use(express.static(publicPath));


app.get("/",(req,res)=>{
    res.sendFile(
        path.join(publicPath,"index.html")
    );
});



const server = http.createServer(app);


const io = new Server(server,{
    cors:{
        origin:"*"
    }
});





const db = new sqlite3.Database("messenger.db");



db.serialize(()=>{


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






io.on("connection",(socket)=>{





socket.on("login",(name)=>{


users[socket.id]=name;


io.emit(
"users",
Object.values(users)
);


});






// =================
// СОЗДАТЬ СЕРВЕР
// =================


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








// =================
// ПОЛУЧИТЬ МОИ СЕРВЕРА
// =================


socket.on(
"get-servers",
()=>{


db.all(
`
SELECT * FROM servers
`,
[],
(err,rows)=>{


socket.emit(
"servers",
rows
);


});


});









// =================
// ПОИСК ВСЕХ СЕРВЕРОВ
// =================


socket.on(
"search-servers",
()=>{


db.all(
`
SELECT *
FROM servers
ORDER BY id DESC
`,
[],
(err,rows)=>{


socket.emit(
"all-servers",
rows
);


});


});









// =================
// КОМНАТЫ
// =================


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









socket.on(
"disconnect",
()=>{


delete users[socket.id];


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
"Server started",
PORT
);

});
