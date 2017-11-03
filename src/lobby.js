const io = require('socket.io')();
const redis = require('socket.io-redis');
io.adapter(redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
}));

class Lobby {

    constructor(port) {

        io.on('connection', socket => {
            console.log('Client connected (Lobby) ->', socket.id);

            socket.on('message', event => {
                console.log('Message received: ', event);
            });

            socket.on('disconnect', reason => {
                console.log('Client disconnected: ', reason);
            });
        });

        io.listen(port, () => {
            console.log('Lobby: Listening on port ' + port);
        })

    }

}

module.exports = Lobby