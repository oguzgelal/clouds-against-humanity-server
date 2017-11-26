const env = process.env.NODE_ENV || 'dev';
require('dotenv').config({ path: `./env/${env}.env` })

const pm2 = require('pm2');
const redis = require('redis');
const rediscli = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

console.log('> connecting...');
pm2.connect(err => {
    if (err) {
        console.error(err);
        process.exit(2);
    }

    let options = {
        args: ['--debug']
    };

    console.log('> starting clusters...');
    pm2.start('start.json', options, (err, apps) => {
        console.log('> ✓✓✓ done ✓✓✓');
        console.log('> run `pm2 list` to see the running processes');
        pm2.disconnect();
        process.exit();
        if (err) { throw err };
    });
});