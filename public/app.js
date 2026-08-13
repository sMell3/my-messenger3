const socket = io();


let nickname = "";

let localStream = null;

let peers = {};

let muted = false;





// вход


function join(){


    let input =
    document.getElementById("nickname");


    nickname =
    input.value.trim();



    if(nickname === ""){

        alert("Введите ник");

        return;

    }



    socket.emit(
        "join",
        nickname
    );



    document.getElementById(
        "login"
    ).style.display="none";



    document.getElementById(
        "chat"
    ).style.display="block";


}






// отправка сообщений


function sendMessage(){


    let input =
    document.getElementById("message");


    let text =
    input.value.trim();



    if(text==="") return;



    socket.emit(
        "sendMessage",
        text
    );



    input.value="";


}







document
.getElementById("message")
.addEventListener(
"keydown",
(e)=>{


    if(e.key==="Enter"){

        sendMessage();

    }


});









// сообщения


socket.on(
"message",
(data)=>{


    addMessage(
        data
    );


});




function addMessage(data){


    let box =
    document.getElementById(
        "messages"
    );


    let div =
    document.createElement(
        "div"
    );


    div.className="message";



    div.innerHTML=`

    <b>${data.user}</b><br>

    ${data.text}

    <small>
    ${data.time || ""}
    </small>

    `;



    box.appendChild(div);



    box.scrollTop =
    box.scrollHeight;


}









// история сообщений


socket.on(
"history",
(messages)=>{


    messages.forEach(
        msg=>{

            addMessage(msg);

        }
    );


});









// онлайн пользователи


socket.on(
"onlineUsers",
(users)=>{


    let box =
    document.getElementById(
        "online"
    );


    box.innerHTML="";



    users.forEach(
        user=>{


            let p =
            document.createElement(
                "p"
            );


            p.innerHTML =
            "🟢 " + user;



            box.appendChild(p);


        }
    );


});









// ======================
//      VOICE CHAT
// ======================




async function startVoice(){


    if(localStream){

        return;

    }



    try{


        localStream =
        await navigator
        .mediaDevices
        .getUserMedia({

            audio:true

        });



        alert(
            "🎤 Микрофон включён"
        );



        socket.emit(
            "voice-ready"
        );



    }

    catch(error){


        alert(
            "Нет доступа к микрофону"
        );


        console.log(error);


    }


}








function muteVoice(){


    if(!localStream){

        return;

    }



    muted =
    !muted;



    localStream
    .getAudioTracks()
    .forEach(
        track=>{


            track.enabled =
            !muted;


        }
    );



}









// получение предложения WebRTC


socket.on(
"voice-offer",
async(data)=>{


    let peer =
    createPeer(
        data.id
    );



    await peer.setRemoteDescription(
        data.offer
    );



    let answer =
    await peer.createAnswer();



    await peer.setLocalDescription(
        answer
    );



    socket.emit(
        "voice-answer",
        {

            id:data.id,

            answer:answer

        }
    );


});









socket.on(
"voice-answer",
async(data)=>{


    let peer =
    peers[data.id];


    if(peer){


        await peer.setRemoteDescription(
            data.answer
        );


    }


});









socket.on(
"ice-candidate",
async(data)=>{


    let peer =
    peers[data.id];



    if(peer){


        await peer.addIceCandidate(
            data.candidate
        );


    }


});









function createPeer(id){


    let peer =
    new RTCPeerConnection();



    peers[id]=peer;





    if(localStream){


        localStream
        .getTracks()
        .forEach(
            track=>{


                peer.addTrack(
                    track,
                    localStream
                );


            }
        );


    }






    peer.onicecandidate =
    (event)=>{


        if(event.candidate){


            socket.emit(
                "ice-candidate",
                {

                    id:id,

                    candidate:
                    event.candidate

                }
            );


        }


    };





    peer.ontrack =
    (event)=>{


        let audio =
        document.createElement(
            "audio"
        );


        audio.autoplay=true;


        audio.srcObject =
        event.streams[0];



        document
        .getElementById(
            "voiceUsers"
        )
        .appendChild(
            audio
        );


    };



    return peer;


}
