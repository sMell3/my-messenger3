const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");


const app = express();

app.use(cors());


// папка с сайтом
const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));



// главная страница

app.get("/", (req, res) => {

    res.sendFile(
        path.join(publicPath, "index.html")
    );

});



const server = http.createServer(app);



const io = new Server(server, {

    cors: {
        origin: "*"
    }

});



// пользователи онлайн

let users = {};



// подключение

io.on("connection", (socket)=>{


    console.log(
        "Новое подключение:",
        socket.id
    );



    socket.on("join",(nickname)=>{


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


    });




    socket.on("sendMessage",(text)=>{


        const nickname =
        users[socket.id] || "Unknown";



        io.emit(
            "message",
            {

                user:nickname,

                text:text,

                time:new Date().toLocaleTimeString()

            }
        );


    });





    socket.on("disconnect",()=>{


        const nickname =
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
                    text:`${nickname} вышел`,
                    time:new Date().toLocaleTimeString()
                }
            );

        }


    });



});





// Render использует свой порт

const PORT =
process.env.PORT || 3000;



server.listen(PORT,()=>{


    console.log(
        `Server started on ${PORT}`
    );


});
