const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");


const app = express();

app.use(cors());


// папка сайта
app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);



const server = http.createServer(app);



const io = new Server(server, {

    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }

});



// пользователи онлайн

let users = {};



// подключение

io.on("connection", (socket) => {


    console.log(
        "Подключился:",
        socket.id
    );



    // вход

    socket.on(
        "join",
        (nickname)=>{


            users[socket.id] = nickname;



            io.emit(
                "onlineUsers",
                Object.values(users)
            );



            io.emit(
                "message",
                {
                    user:"SERVER",
                    text:`${nickname} вошёл в чат`,
                    time:new Date().toLocaleTimeString()
                }
            );


        }
    );




    // сообщение

    socket.on(
        "sendMessage",
        (text)=>{


            let nickname =
            users[socket.id] || "Unknown";



            io.emit(
                "message",
                {

                    user:nickname,

                    text:text,

                    time:new Date().toLocaleTimeString()

                }
            );


        }
    );





    // отключение

    socket.on(
        "disconnect",
        ()=>{


            let nickname =
            users[socket.id];



            delete users[socket.id];



            io.emit(
                "onlineUsers",
                Object.values(users)
            );



            if(nickname){


                io.emit(
                    "message",
                    {

                        user:"SERVER",

                        text:`${nickname} вышел из чата`,

                        time:new Date().toLocaleTimeString()

                    }
                );


            }



            console.log(
                "Отключился:",
                socket.id
            );


        }
    );


});





// keep alive

setInterval(()=>{

    console.log(
        "Server active"
    );

},60000);






// Render сам выдаёт PORT

const PORT =
process.env.PORT || 3000;



server.listen(
    PORT,
    ()=>{

        console.log(
            `Сервер запущен на порту ${PORT}`
        );

    }
);
