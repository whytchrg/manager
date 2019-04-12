
const dotenv = require('dotenv').config()

const Wtc   = require('./modules/wtc')

let wtc = new Wtc({
  local:      process.env.LOCAL,
  url:        process.env.MONGO,
  db:         'wtc',
  collection: 'A5'
})
