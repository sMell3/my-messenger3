const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");


const app = express();

app.use(cors());

app.use(express.static("../public"));


const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: "*"
    }
});


// список пользователей онлайн
let users = {};



io.on("connection", (socket) => {

    console.log("Подключился пользователь:", socket.id);



    // вход по нику
    socket.on("join", (nickname) => {


        users[socket.id] = nickname;


        io.emit("onlineUsers", Object.values(users));


        io.emit("message", {
            user: "SERVER",
            text: `${nickname} вошёл в чат`
        });


    });



    // сообщение
    socket.on("sendMessage", (text) => {


        let nickname = users[socket.id] || "Unknown";


        io.emit("message", {

            user: nickname,

            text: text,

            time: new Date().toLocaleTimeString()

        });


    });



    // выход
    socket.on("disconnect", () => {


        let nickname = users[socket.id];


        delete users[socket.id];


        io.emit("onlineUsers", Object.values(users));



        if(nickname){

            io.emit("message", {

                user:"SERVER",

                text:`${nickname} вышел из чата`

            });

        }


        console.log("Пользователь отключился");

    });


});





server.listen(3000, () => {

    console.log(
        "Сервер запущен: http://localhost:3000"
    );

});