// bat, clown, ghost, grave, pumpkin, spider, tree, vampire, witch, zombie
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

// Random array of n
function createArray(N, C, D) {
    let arr = [];
    let br = 0;
    for (let i = 0; i < N*N; i+=C) {
        for(let j = 0; j < C; j++){
            arr.push(br);
        }
        br++;
        if(br >= D) br = 0;
    }
    // shuffle array
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // arr to matrix NxN
    let matrix = [];
    for (let i = 0; i < N; i++) {
        matrix.push(arr.slice(i*N, i*N+N));
    }
    return matrix;
}

$(document).ready(function() {
    // Intialization
    let last = location.href.split('/')[location.href.split('/').length - 1];
    let type = last.split('?')[0];
    let params = last.split('?')[1];
    let D, C, N, Shuffle = false;
    if (type == "easy"){
        D = 8;
        C = 2;
        N = 4;
    }
    else if(type == "medium"){
        D = 9;
        C = 3;
        N = 6;
    }
    else if(type == "hard"){
        D = 10;
        C = 4;
        N = 8;
    }
    else if(type == "extreme"){
        D = 10;
        C = 3;
        N = 12;
        Shuffle = true;
    }
    else if(type == "custom"){
        N = Number(params.split('&')[0].split('=')[1]);
        C = Number(params.split('&')[1].split('=')[1]);
        D = Number(params.split('&')[2].split('=')[1]);
        Shuffle = params.split('&')[3].split('=')[1] == "true";
        if(!N || !C || !D){
            window.location.href = "/";
        }
        if(N < 3 || N > 12){
            alert("N must be between 3 and 12");
            window.location.href = "/";
        }
        if(C < 2 || C > 6){
            alert("C must be between 2 and 6");
            window.location.href = "/";
        }
        if(D < 3 || D > 10){
            alert("D must be between 3 and 10");
            window.location.href = "/";
        }
        if(N % C != 0){
            alert("N must be divisible by C");
            window.location.href = "/";
        }
    }
    else{
        alert("Invalid URL Parameters");
        location.href = "/";
    }
    $(".start-mode").text(type);
    $(".start-N").text(N);
    $(".start-C").text(C);
    $(".start-D").text(D);
    $(".start-shuffle").text(Shuffle ? "Yes" : "No");
    let time = 0;
    let moves = 0;
    function startGame() {
        let matrix = createArray(N, C, D);
        // Show matrix in card-grid
        for (let i = 0; i < N; i++) {
            let card_row = $("<div>").addClass("card-grid-row");
            for (let j = 0; j < N; j++) {
                let card_item = $("<div>").addClass("card-item");
                let card_item_inner = $("<div>").addClass("card-item-inner");
                let card_item_front = $("<div>").addClass("card-item-front");
                card_item_front.text("?");
                let card_item_back = $("<div>").addClass("card-item-back");
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
        // Variables for game
        let cards = [];
        let can_open = true;

        let is_paused = false;

        let timerClock = setInterval(function() {
            if(is_paused) return;
            time++;
            $(".time-value").text(Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + time % 60);
        }, 1000);

        // Click event on card-item
        $(".card-item").click(function() {
            // if($(this).hasClass("card-item-flipped")){
            //     $(this).removeClass("card-item-flipped");
            // }
            // else{
            //     $(this).addClass("card-item-flipped");
            // }
            // Get index of clicked card
            let index = $(this).index();
            let row = $(this).parent().index();
            //console.log(can_open)
            if(matrix[row][index] != -1 && !$(this).hasClass("card-item-flipped") && can_open){
                moves++;
                $(".moves-value").text(moves);
                can_open = false;
                let obj = this;
                let image = $("<img>").attr("src", symbols[matrix[row][index]]);
                $(this).children(".card-item-inner").children(".card-item-back").html(image);
                //$(this).children(".card-item-inner").children(".card-item-back").append(image);
                image.bind("load", function() {
                    $(obj).addClass("card-item-flipped");
                    setTimeout(function(){
                        if(cards.length < C - 1){
                            if(cards.length == 0){
                                cards.push({
                                    i: row,
                                    j: index
                                });  
                            }
                            else if(matrix[row][index] == matrix[cards[cards.length - 1].i][cards[cards.length - 1].j]){
                                cards.push({
                                    i: row,
                                    j: index
                                });  
                            }
                            else{
                                cards.forEach(function(card){
                                    $(".card-item").eq(card.i * N + card.j).removeClass("card-item-flipped");
                                    $(".card-item-back").eq(card.i * N + card.j).html("");
                                });
                                $(".card-item").eq(row*N+index).removeClass("card-item-flipped");
                                $(".card-item-back").eq(row*N+index).html("");
                                cards = [];
                                setTimeout(function() {
                                    can_open = true;
                                }, 600);
                            }
                            can_open = true;
                        }
                        else{
                            if(matrix[row][index] == matrix[cards[cards.length - 1].i][cards[cards.length - 1].j]){
                                cards.forEach(function(card){
                                    $(".card-item").eq(card.i * N + card.j).removeClass("card-item-flipped");
                                    matrix[card.i][card.j] = -1;
                                    $(".card-item-front").eq(card.i * N + card.j).html(`<i class="far fa-check-square"></i>`);
                                });
                                $(".card-item").eq(row*N+index).removeClass("card-item-flipped");
                                matrix[row][index] = -1;
                                $(".card-item-front").eq(row*N+index).html(`<i class="far fa-check-square"></i>`);
                                let numberOfNegOnes = 0;
                                for(let i = 0; i < N; i++){
                                    for(let j = 0; j < N; j++){
                                        if(matrix[i][j] == -1){
                                            numberOfNegOnes++;
                                        }
                                    }
                                }
                                setTimeout(function() {
                                    if(numberOfNegOnes == N*N){
                                        clearInterval(timerClock);
                                        //alert("You won!\nTime: " + Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + time % 60 + "\nMoves: " + moves);
                                        //location.href = "/";
                                        // Fill gameover-menu with data
                                        $(".gameover-time").text(Math.floor(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + time % 60);
                                        $(".gameover-moves").text(moves);
                                        $(".gameover-con").css("display", "flex");
                                        return;
                                    }
                                    if(!Shuffle){
                                        can_open = true;
                                        cards = [];
                                    }
                                    else{
                                        $(".shuffling").show();
                                        is_paused = true;
                                        let arr = [];
                                        // Matrix to arr
                                        for(let i = 0; i < N; i++){
                                            for(let j = 0; j < N; j++){
                                                arr.push(matrix[i][j]);
                                            }
                                        }
                                        let shuffleMoves = [];
                                        // shuffle array
                                        for (let i = arr.length - 1; i > 0; i--) {
                                            if(shuffleMoves.length < 2*N){
                                                if(Math.random() > 0.3){
                                                    const j = Math.floor(Math.random() * (i + 1));
                                                    [arr[i], arr[j]] = [arr[j], arr[i]];
                                                    shuffleMoves.push({
                                                        from: {
                                                            i: Math.floor(i / N),
                                                            j: i % N
                                                        },
                                                        to: {
                                                            i: Math.floor(j / N),
                                                            j: j % N,
                                                        }
                                                    });
                                                }
                                            }
                                            else break;
                                        } 
                                        // arr to matrix
                                        matrix = [];
                                        for (let i = 0; i < N; i++) {
                                            matrix.push(arr.slice(i*N, i*N+N));
                                        }
                                        //console.log(shuffleMoves[0]);
                                        let controlIndex = 0;
                                        const pomFunction = () => {
                                            if(controlIndex == shuffleMoves.length){
                                                can_open = true;
                                                cards = [];
                                                is_paused = false;
                                                $(".shuffling").hide();
                                                return;
                                            }
                                            let pos = shuffleMoves[controlIndex];
                                            let first = $(".card-item-inner").eq(pos.from.i * N + pos.from.j);
                                            let second = $(".card-item-inner").eq(pos.to.i * N + pos.to.j);
                                            let fparent = first.parent();
                                            let sparent = second.parent();
                                            first.animate({
                                                left: (second.offset().left - first.offset().left) * 100 / innerWidth + "vw",
                                                top:  (second.offset().top - first.offset().top) * 100 / innerWidth + "vw"
                                            }, 500);
                                            second.animate({
                                                left: (first.offset().left - second.offset().left) * 100 / innerWidth + "vw",
                                                top:  (first.offset().top - second.offset().top) * 100 / innerWidth + "vw"
                                            }, 500, function(){
                                                fparent.html(second);
                                                second.removeAttr("style");
                                                sparent.html(first);
                                                first.removeAttr("style");
                                                controlIndex++;
                                                pomFunction();
                                            });
                                        };
                                        pomFunction();
                                    }
                                }, 600);
                            }
                            else{
                                cards.forEach(function(card){
                                    $(".card-item").eq(card.i * N + card.j).removeClass("card-item-flipped");
                                    $(".card-item-back").eq(card.i * N + card.j).html("");
                                });
                                $(".card-item").eq(row*N+index).removeClass("card-item-flipped");
                                $(".card-item-back").eq(row*N+index).html("");
                                cards = [];
                                setTimeout(function() {
                                    can_open = true;
                                }, 600);
                            }
                        }
                    }, 600);
                });
            }
        });
    }
    $(".start-btn").click(function(){
        $(".start-con").hide();
        startGame();
    });
    $(".gameover-btn").click(function(){
        location.href = "/";
    });
    // gameover-send click
    $(".gameover-send").click(function(){
        if(type != "custom"){
            let name = $(".gameover-name").val();
            if(name.length == 0) name = "Anonymous";
            let obj = {
                mode: type,
                score: {
                    name: name,
                    time: time,
                    moves: moves
                },
                error : function(err){
                    alert("Error: " + err);
                }
            };
            $.ajax({
                url: "/writescore",
                type: "POST",
                data: JSON.stringify(obj),
                contentType: "application/json"
            }).done(function(data){
                alert("Score sent!");
                location.href = "/";
            });
        }
        else{
            alert("Custom mode score can't be saved !");
        }
    });
    //startGame();
});

window.onresize = function(){
    let cardsize = $(".card-item").width();
    $(".card-item").css("margin", (cardsize * 2) / innerWidth + "vw");
    $(".card-item-front").css("font-size", (cardsize * 70) / innerWidth + "vw");
    $(".card-item-front").css("padding-top", cardsize * 8 / innerWidth + "vw");
};