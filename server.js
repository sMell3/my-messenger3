const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();



const app = express();

app.use(cors());


// папка сайта

const publicPath = path.join(
    __dirname,
    "public"
);


app.use(
    express.static(publicPath)
);



app.get("/", (req,res)=>{

    res.sendFile(
        path.join(
            publicPath,
            "index.html"
        )
    );

});





const server = http.createServer(app);



const io = new Server(server,{

    cors:{
        origin:"*"
    }

});





// база сообщений

const db = new sqlite3.Database(
    "chat.db"
);



db.run(`

CREATE TABLE IF NOT EXISTS messages (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user TEXT,

text TEXT,

time TEXT

)

`);





let users = {};





io.on("connection",(socket)=>{


    console.log(
        "Подключение:",
        socket.id
    );





    // вход


    socket.on("join",(nickname)=>{


        users[socket.id] = nickname;



        io.emit(
            "onlineUsers",
            Object.values(users)
        );



        socket.emit(
            "history",
            []
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

            }

        );



        io.emit(
            "message",
            {

                user:"SERVER",

                text:
                `${nickname} вошёл`,

                time:
                new Date()
                .toLocaleTimeString()

            }
        );


    });






    // сообщения



    socket.on("sendMessage",(text)=>{


        let user =
        users[socket.id] || "Unknown";



        let time =
        new Date()
        .toLocaleTimeString();




        db.run(

            `
            INSERT INTO messages
            (user,text,time)

            VALUES (?,?,?)

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








    // ===== VOICE CHAT WEBRTC =====



    socket.on(
        "voice-offer",
        (data)=>{


            socket.broadcast.emit(
                "voice-offer",
                {

                    id:socket.id,

                    offer:data

                }

            );


        }

    );





    socket.on(
        "voice-answer",
        (data)=>{


            socket.broadcast.emit(
                "voice-answer",
                data

            );


        }

    );






    socket.on(
        "ice-candidate",
        (data)=>{


            socket.broadcast.emit(
                "ice-candidate",
                {

                    id:socket.id,

                    candidate:data

                }

            );


        }

    );








    // выход



    socket.on(
        "disconnect",
        ()=>{


            let name =
            users[socket.id];



            delete users[socket.id];



            io.emit(
                "onlineUsers",
                Object.values(users)
            );



            if(name){


                io.emit(
                    "message",
                    {

                    user:"SERVER",

                    text:
                    `${name} вышел`,

                    time:
                    new Date()
                    .toLocaleTimeString()

                    }

                );


            }



        }

    );



});







const PORT =
process.env.PORT || 3000;



server.listen(
    PORT,
    ()=>{


        console.log(
            `Server started on ${PORT}`
        );


    }
);
