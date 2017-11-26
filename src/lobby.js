const pm2 = require('pm2');
const io = require('socket.io')();
const redis = require('redis');
const rediscli = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});
//const redisio = require('socket.io-redis');
//io.adapter(redisio({
//    host: process.env.REDIS_HOST,
//    port: process.env.REDIS_PORT
//}));

class Lobby {

    constructor(port) {
        const self = this;
        self.rooms = [];

        rediscli.on('connect', () => {
            console.log('Redis connection establisted');
            rediscli.get('rooms', (err, reply) => {
                console.log('Fetched rooms!!', reply);
                self.rooms = JSON.parse(reply);
            });
        })

        console.log('lobby cluster started on port ' + port);

        io.on('connection', socket => {
            console.log('Client connected (Lobby) ->', socket.id);

            socket.on('test', event => {
                console.log('Test signal...');
                pm2.list((err, list) => {
                    console.log('Active processes: ', list);
                })
            })

            socket.on('create-room', event => {

                if (!event.userid) {
                    socket.emit('create-room.failed');
                    return;
                }

                self.createRoom({
                    userid: event.userid,
                    username: event.username,
                    name: event.name || `${event.username}'s room`
                });

                console.log('Room created', self.getRooms());

            });

            socket.on('get-rooms', event => {
                socket.emit('get-rooms.response', self.getRooms());
            });

            socket.on('disconnect', reason => {
                console.log('Client disconnected: ', reason);
            });
        });

        io.listen(port, () => {
            console.log('Lobby: Listening on port ' + port);
        })

    }

    createRoom(data) {
        console.log('Creating room...');
        this.rooms.push(data);
        rediscli.set('rooms', JSON.stringify(this.rooms))
        rediscli.get('rooms', (err, reply) => {
            console.log('Fetched rooms!!', reply);
        });
    }

    getRooms() {
        return this.rooms;
    }

}

module.exports = Lobby