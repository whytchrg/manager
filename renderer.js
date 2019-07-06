
const dotenv = require('dotenv').config()
const pjson  = require('./package.json')

const Wtc    = require('./modules/wtc')

let wtc = new Wtc({
  path:       process.env.LOCAL, // path to local directory
  display:    '.display',       // display directory
  thumbnails: '.thumbnail',     // thumbnails directory
  extension:  '.png',           // preview file extension

  url:        process.env.MONGO,
  db:         pjson.name, // APP name
  collection: process.env.LOCAL.match(/([^\/]*)\/*$/)[1], // A5
  remote:     './public_html/src/' + process.env.LOCAL.match(/([^\/]*)\/*$/)[1] + '/',
  ftphost:    process.env.FTP_HST,
  ftpport:    process.env.FTP_PRT,
  ftpuser:    process.env.FTP_USR,
  ftppass:    process.env.FTP_KEY,
  http:       process.env.HTTP,
  userid:     process.env.FLICKR_USER_ID,
  apikey:     process.env.FLICKR_API_KEY
})
