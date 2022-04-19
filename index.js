const express = require('express');
const socket = require('socket.io');

var app = express();
var server = app.listen(8082,function(){
    console.log('Listening Port');
});

app.use(express.static("public"));
var io = socket(server);

io.on("connection",function(socket){
    socket.on('join',function(roomname){
        
        let rooms = io.sockets.adapter.rooms;
        let room = rooms.get(roomname);
        console.log(rooms,roomname);
        if(room==undefined){
            socket.join(roomname);
            socket.emit("letJoin","created");
            console.log('room created');
        }else if(room.size==1){
            socket.join(roomname);
            socket.emit("letJoin","joined");
            console.log('room joined');
        }else{""
            io.emit("letJoin","full");
            console.log('room is full');
        }
    });
    console.log('webSocket Connected', socket.id);

    socket.on("ready", function (roomName) {
        console.log("ready",roomName);
        socket.broadcast.to(roomName).emit("ready"); //Informs the other peer in the room.
    });
    
    socket.on("candidate", function (candidate, roomName) {
        console.log(candidate);
        socket.broadcast.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
      });

    socket.on("offer", function (offer, roomName) {
    socket.broadcast.to(roomName).emit("offer", offer); //Sends Offer to the other peer in the room.
  });
    
  socket.on("answer", function (answer, roomName) {
    socket.broadcast.to(roomName).emit("answer", answer); //Sends Answer to the other peer in the room.
  });
});

