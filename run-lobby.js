const env = process.env.NODE_ENV || 'dev';
require('dotenv').config({ path: `./env/${env}.env` })

const Lobby = require('./src/lobby.js')
new Lobby(8080)