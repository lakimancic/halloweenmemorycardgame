let symbols = [
    "/images/bat.png",
    "/images/clown.png",
    "/images/ghost.png",
    "/images/grave.png",
    "/images/pumpkin.png",
    "/images/spider.png",
    "/images/tree.png",
    "/images/vampire.png",
    "/images/witch.png",
    "/images/zombie.png"
];

$(document).ready(function() {
    let socket = io();

    //console.log(window.location.href.split('/'));
    let mode = window.location.href.split('/')[4];
    if(mode == 'create'){
        socket.emit('create_room', {
            name: window.location.href.split('/')[5]
        });
        $(".player1").children('.player-name').text(window.location.href.split('/')[5] + " ( You )");

        socket.on('room_created', function(data){
            $(".gameid .value").text(data.room);
            $(".status").text("Waiting for partner");
        });

        socket.on('room_joined', function(data){
            $(".player2").children('.player-name').text(data.player2);
            $(".status").text("Waiting you to start Game");
            $(".start-con").css("display", "flex");

            $(".start-btn").click(function(){
                socket.emit('start_game', {
                    room: data.room,
                    host: data.player1
                });
            });
        });
        let turn;

        socket.on('game_started', function(data){
            $(".time").css("display", "block");
            $(".status").text("Your turn");
            $('.moves').css("display", "block");
            $(".start-con").css("display", "none");
            turn = data.turn;

            let N = 4;
            for (let i = 0; i < N; i++) {
                let card_row = $("<div>").addClass("card-grid-row");
                for (let j = 0; j < 2*N; j++) {
                    let card_item = $("<div>").addClass("card-item");
                    let card_item_inner = $("<div>").addClass("card-item-inner");
                    let card_item_front = $("<div>").addClass("card-item-front");
                    card_item_front.text("?");
                    let card_item_back = $("<div>").addClass("card-item-back");
                    if(j >= 4){
                        card_item_front.css("background-color", "rgb(26, 26, 26)");
                        card_item_front.css("color", "rgb(128, 103, 57)");
                        card_item_back.css("color", "rgb(128, 103, 57)");
                        card_item_back.css("background-color", "rgb(26, 26, 26)");
                    }
                    //card_item_back.append($("<img>").attr("src", symbols[matrix[i][j]]));
                    card_item_inner.append(card_item_front);
                    card_item_inner.append(card_item_back);
                    card_item.append(card_item_inner);
                    card_row.append(card_item);
                }
                $(".card-grid").append(card_row);
            }
            let cardsize = $(".card-item").width();
            $(".card-item").css("margin", (cardsize * 2) / innerWidth + "vw");
            $(".card-item-front").css("font-size", (cardsize * 70) / innerWidth + "vw");
            $(".card-item-front").css("padding-top", cardsize * 8 / innerWidth + "vw");

            $(".card-item").click(function(){
                let index = $(this).index();
                let row = $(this).parent().index();

                if(index < 4){
                    socket.emit('card_clicked', {
                        room: data.room,
                        row: row,
                        index: index,
                        player: 1
                    });
                }
            });
        });

        socket.on('first_clicked', function(data){
            if(data.turn == 1){
                $(".status").text("Your turn");
            }
            else{
                $(".status").text("Partner's turn");
            }
            $(".moves-value").text(data.moves);
            let image = $("<img>").attr("src", symbols[data.value]);
            image.bind('load', function() {
                let card_item = $(".card-item").eq(data.row*8 + data.index);
                card_item.children('.card-item-inner').children('.card-item-back').html(image);
                card_item.addClass("card-item-flipped");
            });
        });

        socket.on('cards_matched', function(data){
            if(data.turn == 1){
                $(".status").text("Your turn");
            }
            else{
                $(".status").text("Partner's turn");
            }
            $(".moves-value").text(data.moves);
            let image = $("<img>").attr("src", symbols[data.value]);
            image.bind('load', function() {
                let card_item = $(".card-item").eq(data.row2*8 + data.index2);
                card_item.children('.card-item-inner').children('.card-item-back').html(image);
                card_item.addClass("card-item-flipped");
                setTimeout(function(){
                    card_item.removeClass("card-item-flipped");
                    let card_item2 = $(".card-item").eq(data.row1*8 + data.index1);
                    card_item2.removeClass("card-item-flipped");
                    $(".card-item-front").eq(data.row1 * 8 + data.index1).html(`<i class="far fa-check-square"></i>`);
                    $(".card-item-front").eq(data.row2 * 8 + data.index2).html(`<i class="far fa-check-square"></i>`);
                }, 600);
            });
        });

        socket.on('cards_not_matched', function(data){
            if(data.turn == 1){
                $(".status").text("Your turn");
            }
            else{
                $(".status").text("Partner's turn");
            }
            $(".moves-value").text(data.moves);
            let image = $("<img>").attr("src", symbols[data.value]);
            image.bind('load', function() {
                let card_item = $(".card-item").eq(data.row2*8 + data.index2);
                card_item.children('.card-item-inner').children('.card-item-back').html(image);
                card_item.addClass("card-item-flipped");
                setTimeout(function(){
                    card_item.removeClass("card-item-flipped");
                    let card_item2 = $(".card-item").eq(data.row1*8 + data.index1);
                    card_item2.removeClass("card-item-flipped");
                    setTimeout(function(){
                        $(".card-item-back").eq(data.row1 * 8 + data.index1).html("");
                        $(".card-item-back").eq(data.row2 * 8 + data.index2).html("");
                    }, 600);
                }, 600);
            });
        });

        socket.on('timer', function(data){
            $(".time-value").text(Math.floor(data.time / 60) + ":" + (data.time % 60 < 10 ? "0" : "") + data.time % 60);
        });

        socket.on("player_disconnected", function(data){
            alert("Your Game Partner Left the Game !");
            window.location.href = "/";
        });

        socket.on("game_end", function(data){
            $('.gameover-con').css("display", "flex");
            $(".gameover-time").text(Math.floor(data.time / 60) + ":" + (data.time % 60 < 10 ? "0" : "") + data.time % 60);
            $(".gameover-moves").text(data.moves);
        });
    }
    if(mode == 'join'){
        socket.emit('join_room', {
            room: window.location.href.split('/')[5],
            name: window.location.href.split('/')[6]
        });
        $(".player2").children('.player-name').text(window.location.href.split('/')[6] + " ( You )");

        socket.on('room_joined', function(data){
            $(".gameid .value").text(data.room);
            $(".player1").children('.player-name').text(data.player1);
            $(".status").text("Waiting host to start Game");
        });

        socket.on('game_started', function(data){
            $(".time").css("display", "block");
            $(".status").text("Partner's turn");
            $('.moves').css("display", "block");
            $(".start-con").css("display", "none");

            let N = 4;
            for (let i = 0; i < N; i++) {
                let card_row = $("<div>").addClass("card-grid-row");
                for (let j = 0; j < 2*N; j++) {
                    let card_item = $("<div>").addClass("card-item");
                    let card_item_inner = $("<div>").addClass("card-item-inner");
                    let card_item_front = $("<div>").addClass("card-item-front");
                    card_item_front.text("?");
                    let card_item_back = $("<div>").addClass("card-item-back");
                    if(j < 4){
                        card_item_front.css("background-color", "rgb(26, 26, 26)");
                        card_item_front.css("color", "rgb(128, 103, 57)");
                        card_item_back.css("color", "rgb(128, 103, 57)");
                        card_item_back.css("background-color", "rgb(26, 26, 26)");
                    }
                    //card_item_back.append($("<img>").attr("src", symbols[matrix[i][j]]));
                    card_item_inner.append(card_item_front);
                    card_item_inner.append(card_item_back);
                    card_item.append(card_item_inner);
                    card_row.append(card_item);
                }
                $(".card-grid").append(card_row);
            }

            let cardsize = $(".card-item").width();
            $(".card-item").css("margin", (cardsize * 2) / innerWidth + "vw");
            $(".card-item-front").css("font-size", (cardsize * 70) / innerWidth + "vw");
            $(".card-item-front").css("padding-top", cardsize * 8 / innerWidth + "vw");

            $(".card-item").click(function(){
                let index = $(this).index();
                let row = $(this).parent().index();

                if(index >= 4){
                    socket.emit('card_clicked', {
                        room: data.room,
                        row: row,
                        index: index,
                        player: 2
                    });
                }
            });
        });

        socket.on('first_clicked', function(data){
            if(data.turn == 2){
                $(".status").text("Your turn");
            }
            else{
                $(".status").text("Partner's turn");
            }
            $(".moves-value").text(data.moves);
            //$(".card-item").eq(data.row*4 + data.index).addClass("card-item-flipped");
            let image = $("<img>").attr("src", symbols[data.value]);
            image.bind('load', function() {
                let card_item = $(".card-item").eq(data.row*8 + data.index);
                card_item.children('.card-item-inner').children('.card-item-back').html(image);
                card_item.addClass("card-item-flipped");
            });
        });

        socket.on('cards_matched', function(data){
            if(data.turn == 2){
                $(".status").text("Your turn");
            }
            else{
                $(".status").text("Partner's turn");
            }
            $(".moves-value").text(data.moves);
            let image = $("<img>").attr("src", symbols[data.value]);
            image.bind('load', function() {
                let card_item = $(".card-item").eq(data.row2*8 + data.index2);
                card_item.children('.card-item-inner').children('.card-item-back').html(image);
                card_item.addClass("card-item-flipped");
                setTimeout(function(){
                    card_item.removeClass("card-item-flipped");
                    let card_item2 = $(".card-item").eq(data.row1*8 + data.index1);
                    card_item2.removeClass("card-item-flipped");
                    $(".card-item-front").eq(data.row1 * 8 + data.index1).html(`<i class="far fa-check-square"></i>`);
                    $(".card-item-front").eq(data.row2 * 8 + data.index2).html(`<i class="far fa-check-square"></i>`);
                }, 600);
            });
        });

        socket.on('cards_not_matched', function(data){
            if(data.turn == 2){
                $(".status").text("Your turn");
            }
            else{
                $(".status").text("Partner's turn");
            }
            $(".moves-value").text(data.moves);
            let image = $("<img>").attr("src", symbols[data.value]);
            image.bind('load', function() {
                let card_item = $(".card-item").eq(data.row2*8 + data.index2);
                card_item.children('.card-item-inner').children('.card-item-back').html(image);
                card_item.addClass("card-item-flipped");
                setTimeout(function(){
                    card_item.removeClass("card-item-flipped");
                    let card_item2 = $(".card-item").eq(data.row1*8 + data.index1);
                    card_item2.removeClass("card-item-flipped");
                    setTimeout(function(){
                        $(".card-item-back").eq(data.row1 * 8 + data.index1).html("");
                        $(".card-item-back").eq(data.row2 * 8 + data.index2).html("");
                    }, 600);
                }, 600);
            });
        });

        socket.on('timer', function(data){
            $(".time-value").text(Math.floor(data.time / 60) + ":" + (data.time % 60 < 10 ? "0" : "") + data.time % 60);
        });

        socket.on('room_full', function(data){
            alert(data.error);
            window.location.href = "/";
        });

        socket.on("player_disconnected", function(data){
            alert("Your Game Partner Left the Game !");
            window.location.href = "/";
        });

        socket.on("game_end", function(data){
            $('.gameover-con').css("display", "flex");
            $(".gameover-time").text(Math.floor(data.time / 60) + ":" + (data.time % 60 < 10 ? "0" : "") + data.time % 60);
            $(".gameover-moves").text(data.moves);
        });
    }

    $(".gameover-btn").click(function(){
        location.href = "/";
    });
});

window.onresize = function(){
    let cardsize = $(".card-item").width();
    $(".card-item").css("margin", (cardsize * 2) / innerWidth + "vw");
    $(".card-item-front").css("font-size", (cardsize * 70) / innerWidth + "vw");
    $(".card-item-front").css("padding-top", cardsize * 8 / innerWidth + "vw");
};