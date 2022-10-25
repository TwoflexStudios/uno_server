const express = require('express');
const cors = require("cors")
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {cors:{
    origin:"*"
}});

const delay = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}
const getRandomColor = () => {
    const colors = ["#FAE509", "#E81825", "#016BB7", "#3CA545"];
    const sorted = Math.floor(Math.random() * (colors.length - 0)) + 0
    return colors[sorted]
}

const getRandomNumber = () => {
    const numbers = ["1","2","3","4","5","6","7", "8", "9", "+2", "block", "reverse"];
    const sorted = Math.floor(Math.random() * (numbers.length - 0)) + 0
    return numbers[sorted]
}

const getRandomID = () => {
    return Math.floor(Math.random() * (999999999 - 1111111)) + 1111111 + "fwafawfwaf" + Math.floor(Math.random() * (999999999 - 1111111)) + 1111111
}

const mesaURL = "http://192.168.0.106:5000/"

let users = [{
    name: "Weslley",
    image: mesaURL + "/images/weslley.png",
    cards:[],
    position: "top",
    id: 1,
    socket: "",
    bot: true
  },
  {
    name: "Sthefany",
    cards:[],
    image: mesaURL + "/images/sthefany.jpg",
    position: "right",
    id: 2,
    socket: "",
    bot: true
  },
  {
    name: "Stheyse",
    cards:[],
    image: mesaURL + "/images/stheyse.jpg",
    position: "bottom",
    id: 3,
    socket: "",
    bot: true
  },
  {
    name: "Priscilla",
    cards:[],
    image: mesaURL + "/images/priscilla.jpg",
    position: "left",
    id: 4,
    socket: "",
    bot: true
  }
];
let socketMesa = "";

let currentUser = 1;

io.on("connection", (socket) => {
    socket.on("mesaJoined", () => {
        socketMesa = socket.id
    })
    socket.on("userJoined", (user) => {
        let usuario = {...user, socket: socket.id};
        socket.to(socketMesa).emit("userJoined", user)
        users.map(item => {
            if(item.id == user.id){
                item.bot = false
                item.socket = socket.id
            }
        })
        socket.broadcast.emit("newUserJoined", user)
    })

    socket.on("giveCard", ({player, quantity, fromBuy = false}) => {
        const arrayGetCards = Array(quantity).fill("c")
        const givedCards = [];
        for( const c of arrayGetCards){
            let color = getRandomColor();
            let number = getRandomNumber()
            let card = {
                cardColor: number === "+4" ? "black" : color,
                cardNumber: number === "block" ? "⊘" : number === "reverse" ? "⤿" : number,
                animation: player.position,
                type: number,
                index: getRandomID()
            }
            player.cards.push(card);
            let newUsers = users.filter(u => u.id !== player.id);
            newUsers.push(player);
            givedCards.push(card)
        }
        io.emit("getCards", {player, cards: givedCards, fromBuy})
    })

    socket.on("passToNextUser", () => {
        io.emit("passToNextUser")
    })

    socket.on("cardTouser", ({user, card}) => {
        const userData = users.find(item => item.id === user.id)
        io.to(userData.socket).emit("getCard", {card})
    })

    socket.on("isBot", ({user}) => {
        const userData = users.find(u => u.id === user.id)
        io.emit("returnIsBot", userData.bot)
    })
    
    socket.on("BenginPlay", async () => {
        let cardsCount = [1,2,3,4,5,6,7];
        let positions = ["top", "left", "right", "bottom"];
        let ids = [1,2,3,4]
        let usuarios = users;

        let index = 0;
        const cardClear = [];
        const clear = Array(7 * usuarios.length).fill("I");
        for (const cle of clear){
            for (const user of usuarios){
                if(user.cards.length < cardsCount.length){
                    let color = getRandomColor();
                    let number = getRandomNumber()
                    let card = {
                        cardColor: number === "+4" ? "black" : color,
                        cardNumber: number === "block" ? "⊘" : number === "reverse" ? "⤿" : number,
                        animation: user.position,
                        type: number,
                        user: user.id,
                        index
                    }
                    user.cards.push(card)
                    cardClear.push(card)
                    index++;
                }
            }
        }
        users = usuarios;
        usuarios.forEach(item => item.cards = [])
        io.emit("started", {users: usuarios, cards:cardClear})
        io.emit("BenginEnd")
        currentUser = users[Math.floor(Math.random() * (users.length - 0)) + 0]
        io.emit("currentUser", currentUser.id)
    })

    socket.on("dropCard", ({user,card}) => {
        io.emit("dropCard", {user,card})
    })


    socket.on("removeCard", ({user,card}) => {
        const userData = users.find(item => item.id == user.id);
        socket.to(userData.socket).emit("removeCard", {...card})
    })

    socket.on("setCurrentUser", (user) => {
        currentUser = user;
        socket.broadcast.emit("currentUser", user.id)
    })
    
    socket.on("getCurrentUser", () => {
        io.emit("currentUserID", currentUser.id)
    })

    socket.on("setCurrentCard", (card) => {
        socket.broadcast.emit("currentCard", {...card})
    })

    socket.on("dropInitialCard", () => {
        let color = getRandomColor();
        let number = getRandomNumber()
        let card = {
            cardColor: number === "+4" ? "black" : color,
            cardNumber: number === "block" ? "⊘" : number === "reverse" ? "⤿" : number,
            animation: "middle",
            type: number,
            user: getRandomID(),
            index: getRandomID(),
        }

        io.emit("initialCard", {...card})
    })

    socket.on("disconnect", () => {
        const user = users.find(item => item.socket == socket.id)
        if(user){
            console.log(user.name + " Desconectado")
            users = users.filter(item => item.socket !== socket.id)
        }
    })
})

server.listen(3000, () => {
  console.log('listening on 3000');
});