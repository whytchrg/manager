
const dotenv = require('dotenv').config()
const pjson  = require('./package.json')

const Wtc   = require('./modules/wtc')

// console.log(pjson.name)

let wtc = new Wtc({
  local:      process.env.LOCAL,
  url:        process.env.MONGO,
  db:         pjson.name,
  collection: process.env.LOCAL.match(/([^\/]*)\/*$/)[1], // A5
  remote:     process.env.REMOTE + process.env.LOCAL.match(/([^\/]*)\/*$/)[1],
  ftphost:    process.env.FTP_HST,
  ftpport:    process.env.FTP_PRT,
  ftpuser:    process.env.FTP_USR,
  ftppass:    process.env.FTP_KEY,
  http:       process.env.HTTP,
  userid:     process.env.FLICKR_USER_ID,
  apikey:     process.env.FLICKR_API_KEY
})
