const pm2 = require('pm2');
const io = require('socket.io')();
const redis = require('redis');
const redisopts = require('./config/redis-options');
const rediscli = redis.createClient(redisopts);

//const redisio = require('socket.io-redis');
//io.adapter(redisio({
//    host: process.env.REDIS_HOST,
//    port: process.env.REDIS_PORT
//}));

const types = {
  CREATE_ROOM_STARTED: 'CREATE_ROOM_STARTED',
  CREATE_ROOM_COMPLETED: 'CREATE_ROOM_COMPLETED',
  CREATE_ROOM_FAILED: 'CREATE_ROOM_FAILED',
  FETCH_ROOMS_STARTED: 'FETCH_ROOMS_STARTED',
  FETCH_ROOMS_COMPLETED: 'FETCH_ROOMS_COMPLETED',
  FETCH_ROOMS_FAILED: 'FETCH_ROOMS_FAILED',
};

class Lobby {

  constructor(port) {
    const self = this;
    self.rooms = [];

    rediscli.on('connect', () => {
      rediscli.get('rooms', (err, reply) => {
        console.log('Fetched rooms!!', reply);
        if (reply) {
          try { self.rooms = JSON.parse(reply); }
          catch (e) { /* do nothing */ }
        }
      });
    })

    console.log('lobby cluster started on port ' + port);

    io.on('connection', socket => {
      console.log('Client connected (Lobby) ->', socket.id);


      /*
      * Create rooms
      */

      socket.on(types.CREATE_ROOM_STARTED, event => {
        
        if (!event.data.userid) {
          socket.emit(`${types.CREATE_ROOM_STARTED}.error`, {
            id: event.id,
            message: 'userid field not provided'
          });
          return;
        }

        self.findBestGameCluster().then(cluster => {
          self.createRoom({
            title: event.data.title || `${event.username}'s room`,
            desc: event.data.desc,
            userid: event.data.userid,
            username: event.data.username,
            playerLimit: event.data.playerLimit,
            allowAudience: event.data.allowAudience,
            audienceLimit: event.data.audienceLimit,
            passwordProtected: event.data.passwordProtected,
            password: event.data.password,
            votingMode: event.data.votingMode,
            started: false,
            cluster_id: cluster.pm2_env.INSTANCE_ID,
            port: 4000 + cluster.pm2_env.INSTANCE_ID,
          }).then(room => {
            console.log('Room created', room);
            console.log('Rooms.', self.getRooms());
            // signal indicating the room was created successfully
            socket.emit(types.CREATE_ROOM_COMPLETED, { id: event.id, room });
            // send signal to all clients to update room list
            io.sockets.emit(types.FETCH_ROOMS_COMPLETED, self.getRooms());
          }).catch(error => {
            console.log('Room cant be created', error);
            socket.emit(types.CREATE_ROOM_FAILED, { id: event.id, error });
          });
        })

      });

      socket.on(types.FETCH_ROOMS_STARTED, event => {
        socket.emit(types.FETCH_ROOMS_COMPLETED, self.getRooms());
      });

      socket.on('disconnect', reason => {
        console.log('Client disconnected: ', reason);
      });
    });

    io.listen(port, () => {
      console.log('Lobby: Listening on port ' + port);
    })

  }

  findBestGameCluster() {
    return new Promise((resolve, reject) => {
      pm2.list((err, list) => {
        let bestCluster = null;
        list.map(cluster => {
          if (cluster.name == 'game') {
            if (!bestCluster) {
              bestCluster = Object.assign(cluster);
            } else if (cluster.monit.memory < bestCluster.monit.memory) {
              bestCluster = Object.assign(cluster);
            }
          }
        });
        resolve(bestCluster)
      })
    });
  }

  createRoom(data) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.rooms.push(data);
      rediscli.set('rooms', JSON.stringify(self.rooms), (err, reply) => {
        if (err) { reject(err); }
        resolve(data);
      })
    })
  }

  getRooms() {
    return this.rooms;
  }

}

module.exports = Lobby