const socket = io();


let nickname = "";



// вход в чат

function join(){


    let input = document.getElementById("nickname");


    nickname = input.value.trim();



    if(nickname === ""){

        alert("Введите ник");

        return;

    }



    socket.emit(
        "join",
        nickname
    );



    document.getElementById("login").style.display = "none";


    document.getElementById("chat").style.display = "block";


}




// отправка сообщения

function sendMessage(){


    let input = document.getElementById("message");


    let text = input.value.trim();



    if(text === ""){

        return;

    }



    socket.emit(
        "sendMessage",
        text
    );



    input.value = "";

}




// Enter для отправки

document
.getElementById("message")
.addEventListener(
"keydown",
function(event){


    if(event.key === "Enter"){

        sendMessage();

    }


});





// получение сообщений

socket.on(
"message",
(data)=>{


    let box = document.getElementById(
        "messages"
    );



    let div = document.createElement(
        "div"
    );



    div.className = "message";



    div.innerHTML = `

    <b>${data.user}</b><br>

    ${data.text}

    <small>
    ${data.time || ""}
    </small>

    `;



    box.appendChild(div);



    box.scrollTop = box.scrollHeight;


});







// список онлайн

socket.on(
"onlineUsers",
(users)=>{


    let box = document.getElementById(
        "online"
    );


    box.innerHTML = "";



    users.forEach(
        user=>{


            let p = document.createElement(
                "p"
            );


            p.innerHTML = 
            "🟢 " + user;


            box.appendChild(p);


        }
    );


});