// Get environment variables from .env file
const env = process.env.NODE_ENV || 'dev';
require('dotenv').config({ path: `./env/${env}.env` })

const pm2 = require('pm2');
const redis = require('redis');
const redisopts = require('./src/config/redis-options.js');

// connect to the process manager
console.log('> connecting to pm2 daemon...');
pm2.connect(err => {
  if (err) { console.error(err); process.exit(2); }

  // connect to Redis database
  console.log('> connecting to redis...');
  const rediscli = redis.createClient(redisopts);
  rediscli.on('connect', () => {


    // clean Redis database on dev
    if (env !== 'prod') {
      console.log('> clearing database...');
      rediscli.flushall();
    }

    // cluster options
    let options = {
      apps: [
        {
          name: 'lobby',
          script: './run-lobby.js',
          instances: 1,
          instance_var: 'INSTANCE_ID',
          exec_mode: 'cluster',
          out_file: './logs/lobby.log'
        },
        {
          name: 'game',
          script: './run-game.js',
          instances: 'max',
          instance_var: 'INSTANCE_ID',
          exec_mode: 'cluster',
          out_file: './logs/game.log'
        }
      ]
    };

    // run in debug mode on dev
    if (env !== 'prod') {
      options.apps.map(options => {
        options.args = ['--debug'];
        options.node_args = ['--inspect=7000'];
        return options
      })
    }

    // start the clusters
    console.log('> starting clusters...');
    pm2.start(options, (err, apps) => {
      if (err) { throw err }
      else {
        console.log('> ✓✓✓ done ✓✓✓');

        // on dev mode, delete launcher process
        if (env !== 'prod') {
          pm2.list((err, processList) => {
            if (err) { throw err };
            processList.map(p => {
              if (p.name === 'run') {
                pm2.delete(p.name, err => {
                  if (err) { throw err };
                  pm2.disconnect();
                  process.exit();
                })
              }
            })
          })
        }

        // prod mode, exit launcher process
        else {
          console.log('> run `pm2 list` to see the running processes.');
          pm2.disconnect();
          process.exit();
        }
      }
    });
  })
});