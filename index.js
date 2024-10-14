require('dotenv').config()
const express = require("express");

const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL

// Import
const { createServer } = require("http")
const { Server } = require("socket.io")


// MongoDB connection


// Create Server Here
const server = createServer(app);

// Create Instance of server
const io = new Server(server, {
    cors: {
        origin: [FRONTEND_URL],
        methods: ["*"],
        credentials: true,
    }
});



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }))


// Now we storing email with room id means which email belogns to which room id.
const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();   //Reverse

// IO connection
io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on("room:join", (data) => {

        const { email, room } = data;

        emailToSocketIdMap.set(email, socket.id);
        socketIdToEmailMap.set(socket.id, email);

        //When new user are come then get notify to old user or notify in the group that new user are come.
        io.to(room).emit("user:joined", { email, id: socket.id });
        socket.join(room);

        io.to(socket.id).emit("room:join", data);
    })


    // This call are come from first user to second user
    socket.on('user:call', ({ to, offer }) => {

        //For second user it is incoming call so we write event name as a incoming call.
        io.to(to).emit("incoming:call", { from: socket.id, offer });
    })



    // This call are come from first user to second user and now second user accecpt it and send reponse to first user
    socket.on('call:accepted', ({ to, ans }) => {

        //For second user it is incoming call so we write event name as a incoming call.
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    })



    // This call are come from second user to first user to reconnect
    socket.on('peer:nego:needed', ({ to, offer }) => {

        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    })



    // This call are come from first user to second user 
    socket.on('peer:nego:done', ({ to, ans }) => {

        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    })


})





// Routes
app.get('/', (req, res) => {
    return res.json("The Dakshet Ghole");
});


// Listen
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});