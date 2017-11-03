const env = process.env.NODE_ENV || 'dev';
require('dotenv').config({ path: `./env/${env}.env` })

const Game = require('./src/game.js')
new Game(3000)