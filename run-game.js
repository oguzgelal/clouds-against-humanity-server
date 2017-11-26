const env = process.env.NODE_ENV || 'dev';
require('dotenv').config({ path: `./env/${env}.env` })

const Game = require('./src/game.js')

if (process.env.INSTANCE_ID) {
    const instanceID = parseInt(process.env.INSTANCE_ID);
    new Game(4000 + instanceID);
}
else {
    console.error('INSTANCE_ID env variable not defined. Failed to start game cluster.');
}
