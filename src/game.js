const io = require('socket.io')();
//const redisio = require('socket.io-redis');
//io.adapter(redisio({
//    host: process.env.REDIS_HOST,
//    port: process.env.REDIS_PORT
//}));

class Game {

  constructor(port) {

    console.log('game cluster started on port ' + port);

    io.on('connection', socket => {
      console.log('Client connected (Game) ->', socket.id);

      socket.on('message', event => {
        console.log('Message received: ', event);
      });

      socket.on('disconnect', reason => {
        console.log('Client disconnected: ', reason);
      });
    });

    io.listen(port, () => {
      console.log('Game: Listening on port ' + port);
    })
  }

}

module.exports = Game