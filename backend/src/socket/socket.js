const socketHandler = (io) =>{
    io.on('connection', (socket) => {
        console.log('Client Connected: ', socket.id);

        socket.on('joinRoom', (userId)=>{
            socket.join(userId);
            console.log(`User with ID: ${userId} joined room: ${socket.id}`);

        });
        socket.on('sendMessage', (messageData)=>{
            const { recieverId } = messageData;
            io.to(recieverId).emit('receiveMessage', messageData);
            console.log(`Message sent to user with ID: ${recieverId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client Disconnected: ', socket.id);
        });
    })
}

export default socketHandler;