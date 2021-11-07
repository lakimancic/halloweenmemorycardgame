// Requires
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('fs');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const io = new Server(server);

app.use(bodyParser.json());

// Read scores
let scores = JSON.parse(fs.readFileSync('scores.json', 'utf8'));
let rooms = {
};
let socket_room = {
};

const createRandom16String = () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

// Consts
const PORT = 3000;

// HTTP METHODS

app.get('/', ( req, res ) => {
    res.sendFile(__dirname + '/static/html/index.html');
});

app.get('/singleplayer', ( req, res ) => {
    res.sendFile(__dirname + '/static/html/singleplayer.html');
});

app.get('/singleplayer/*', ( req, res ) => {
    res.sendFile(__dirname + '/static/html/game_single.html');
});

app.get('/score_boards', ( req, res ) => {
    res.sendFile(__dirname + '/static/html/score_boards.html');
});

app.get('/scores', ( req, res ) => {
    res.send(scores);
});

app.get('/instructions', ( req, res ) => {
    res.sendFile(__dirname + '/static/html/instructs.html');
});

app.get('/credits', ( req, res ) => {
    res.sendFile(__dirname + '/static/html/credits.html');
});

app.post('/writescore', ( req, res ) => {
    //console.log(req.body);
    scores[req.body.mode].push(req.body.score);
    fs.writeFileSync('scores.json', JSON.stringify(scores, null, 4));
    res.sendStatus(200);
});

app.get('/mp_choose', ( req, res) => {
    res.sendFile(__dirname + '/static/html/mp_choose.html');
});

app.get('/multiplayer/create/:name', ( req, res ) => {
    res.sendFile(__dirname + '/static/html/game_multi.html');
});

app.get('/multiplayer/join/:gameid/:name', (req, res) => {
    res.sendFile(__dirname + '/static/html/game_multi.html');
});

// SERVING STATIC FILES

app.get('/js/:file', ( req, res ) => {
    res.sendFile(__dirname + '/static/js/' + req.params.file);
});

app.get('/css/:file', ( req, res ) => {
    res.sendFile(__dirname + '/static/css/' + req.params.file);
});

app.get('/images/:file', ( req, res ) => {
    res.sendFile(__dirname + '/static/images/' + req.params.file);
});

app.get('/fonts/:file', ( req, res ) => {
    res.sendFile(__dirname + '/static/fonts/' + req.params.file);
});

// SOCKET IO

const createGrid = () => {
    let arr1 = [], arr2 = [];
    let control = 0;
    for(let i = 0; i < 16; i++) {
        arr1.push(control);
        arr2.push(control);
        control++;
        if(control >= 10) control = 0;
    }
    // Shuffle arr1
    for (let i = arr1.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr1[i], arr1[j]] = [arr1[j], arr1[i]];
    }
    // Shuffle arr2
    for (let i = arr2.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr2[i], arr2[j]] = [arr2[j], arr2[i]];
    }
    let mat = [];
    for(let i = 0; i < 4; i++) {
        let pomarr = [];
        for(let j=0;j<8;j++){
            if(j < 4) pomarr.push(arr1[i*4 + j]);
            else pomarr.push(arr2[i*4 + j-4]);
        }
        mat.push(pomarr);
    }
    return mat;
}

io.on("connection", function(socket) {
    //console.log("A user connected");
    socket.on("disconnect", function() {
        //console.log("A user disconnected")
        if(rooms[socket_room[socket.id]]) {
            io.to(socket_room[socket.id]).emit("player_disconnected");
            if(rooms[socket_room[socket.id]].timer) clearInterval(rooms[socket_room[socket.id]].timer);
            delete rooms[socket_room[socket.id]];
        }
        delete socket_room[socket.id];
    });

    socket.on('create_room', function(data) {
        let room;
        do{
            room = createRandom16String();
        }while(rooms[room] !== undefined);
        rooms[room] = {
            player1: data.name,
            player2: null,
            grid: null,
            turn: null,
            first: null,
            time: 0,
            moves: 0,
            timer: null
        };
        socket.join(room);
        socket_room[socket.id] = room;
        socket.emit('room_created', {
            room: room,
        });
    });

    socket.on('join_room', function(data) {
        if(rooms[data.room] !== undefined && rooms[data.room].player2 === null){
            rooms[data.room].player2 = data.name;
            socket.join(data.room);
            socket_room[socket.id] = data.room;
            io.to(data.room).emit('room_joined', {
                room: data.room,
                player1: rooms[data.room].player1,
                player2: rooms[data.room].player2
            });
        }
        else{
            socket.emit('room_full', {
                error: 'Room is invalid !'
            });
        }
    });

    socket.on('start_game', function(data) {
        if(rooms[data.room] !== undefined && rooms[data.room].player2 !== null && rooms[data.room].player1 == data.host){
            let grid = createGrid();
            rooms[data.room].grid = grid;
            rooms[data.room].turn = 1;
            rooms[data.room].first = null;
            rooms[data.room].time = 0;
            rooms[data.room].moves = 0;
            rooms[data.room].timer = setInterval(() => {
                rooms[data.room].time++;
                io.to(data.room).emit('timer', {
                    time: rooms[data.room].time
                });
            }, 1000);
            
            io.to(data.room).emit('game_started', {
                room: data.room,
                turn: rooms[data.room].turn,
            });
        }
    });

    socket.on('card_clicked', function(data) {
        if(data.player == rooms[data.room].turn && rooms[data.room].grid[data.row][data.index] != -1){
            if(rooms[data.room].first === null){
                rooms[data.room].first = {
                    row: data.row,
                    index: data.index
                };
                rooms[data.room].turn++;
                if(rooms[data.room].turn > 2) rooms[data.room].turn = 1;
                rooms[data.room].moves++;
                io.to(data.room).emit('first_clicked', {
                    row: data.row,
                    index: data.index,
                    value: rooms[data.room].grid[data.row][data.index],
                    turn: rooms[data.room].turn,
                    moves: rooms[data.room].moves
                });
            }
            else if(rooms[data.room].first.row != data.row || rooms[data.room].first.index != data.index){
                let first = rooms[data.room].first;
                if(rooms[data.room].grid[first.row][first.index] == rooms[data.room].grid[data.row][data.index]){
                    rooms[data.room].moves++;
                    io.to(data.room).emit('cards_matched', {
                        row1: first.row,
                        index1: first.index,
                        //value1: rooms[data.room].grid[first.row][first.index],
                        row2: data.row,
                        index2: data.index,
                        value: rooms[data.room].grid[data.row][data.index],
                        turn: rooms[data.room].turn,
                        moves: rooms[data.room].moves
                    });
                    rooms[data.room].first = null;
                    rooms[data.room].grid[first.row][first.index] = -1;
                    rooms[data.room].grid[data.row][data.index] = -1;
                    let numOfNegOnes = 0;
                    for(let i = 0; i < 4; i++){
                        for(let j = 0; j < 8; j++){
                            if(rooms[data.room].grid[i][j] == -1) numOfNegOnes++;
                        }
                    }
                    if(numOfNegOnes == 32){
                        clearInterval(rooms[data.room].timer);
                        io.to(data.room).emit('game_end', {
                            room: data.room,
                            time: rooms[data.room].time,
                            moves: rooms[data.room].moves
                        });
                        scores["multiplayer"].push({
                            player1: rooms[data.room].player1,
                            player2: rooms[data.room].player2,
                            time: rooms[data.room].time,
                            moves: rooms[data.room].moves
                        });
                        fs.writeFileSync('scores.json', JSON.stringify(scores, null, 4));
                        delete rooms[data.room];
                    }
                }
                else{
                    rooms[data.room].moves++;
                    io.to(data.room).emit('cards_not_matched', {
                        row1: first.row,
                        index1: first.index,
                        //value1: rooms[data.room].grid[first.row][first.index],
                        row2: data.row,
                        index2: data.index,
                        value: rooms[data.room].grid[data.row][data.index],
                        turn: rooms[data.room].turn,
                        moves: rooms[data.room].moves
                    });
                    rooms[data.room].first = null;
                }
            }
        }
    });
});
// Server Listenning
server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});