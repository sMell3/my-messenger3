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




// база сообщений

const db = new sqlite3.Database("chat.db");


db.run(`
CREATE TABLE IF NOT EXISTS messages(
id INTEGER PRIMARY KEY AUTOINCREMENT,
user TEXT,
text TEXT,
time TEXT
)
`);




let users = {};





io.on("connection",(socket)=>{


console.log("connect",socket.id);





// вход

socket.on("join",(name)=>{


users[socket.id]=name;


io.emit(
"onlineUsers",
Object.values(users)
);



db.all(
`
SELECT *
FROM messages
ORDER BY id DESC
LIMIT 50
`,
[],
(err,rows)=>{

if(!err){

socket.emit(
"history",
rows.reverse()
);

}

});


});






// сообщения

socket.on("sendMessage",(text)=>{


let user =
users[socket.id] || "User";


let time =
new Date().toLocaleTimeString();



db.run(
`
INSERT INTO messages(user,text,time)
VALUES(?,?,?)
`,
[
user,
text,
time
]
);



io.emit(
"message",
{
user:user,
text:text,
time:time
}
);



});







// =================
// VOICE CHAT
// =================



socket.on("voice-join",()=>{


socket.broadcast.emit(
"voice-user",
socket.id
);


});





socket.on("voice-offer",(data)=>{


io.to(data.target).emit(
"voice-offer",
{
from:socket.id,
offer:data.offer
}
);


});





socket.on("voice-answer",(data)=>{


io.to(data.target).emit(
"voice-answer",
{
from:socket.id,
answer:data.answer
}
);


});





socket.on("ice-candidate",(data)=>{


io.to(data.target).emit(
"ice-candidate",
{
from:socket.id,
candidate:data.candidate
}
);


});









socket.on("disconnect",()=>{


delete users[socket.id];


io.emit(
"onlineUsers",
Object.values(users)
);


});


});







const PORT =
process.env.PORT || 3000;


server.listen(PORT,()=>{

console.log(
"Server started",
PORT
);

});
