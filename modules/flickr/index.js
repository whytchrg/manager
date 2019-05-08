
"use strict"

const Extend    = require('../extend')
const flickr    = require('flickr-sdk')                 // Flickr

class Flickr extends Extend {

  constructor(options) {
    super()

    this.module = this.constructor.name
    this.icon   = '⨗ '

    this.client = new flickr(options.apikey);

    this.data       = [] // basic Flickr files

    this.init(options)
  }

  init(options) {

    this.client.people.getInfo({
      user_id: options.userid
    }).then((result) => {

      let count = result.body.person.photos.count._content
      // console.log(result.body.person.photos.count._content + ' files on flickr')
      const a = Math.ceil(result.body.person.photos.count._content/500)
      for(let i = 0; i < a; i++) {
        this.client.people.getPublicPhotos({
          user_id: options.userid,
          extras: ['date_upload', 'date_taken', 'last_update', 'tags', 'views'],
          page: i + 1,
          per_page: 500
        }).then((result) => {

          result.body.photos.photo.forEach((element) => {
            this.data.push(element)
            // console.log(element)

            // this.client.photos.getInfo({
            //   photo_id: element.id,
            //   secret: element.secret
            // }).then(function (result) {
            //   this.flickr.push(result.body.photo)
            // }.bind(this)).catch(function (err) {
            //   console.error('bonk', err)
            // })

          })
          if(count == this.data.length) {
            console.log(this.icon + this.log(this.module, this.data.length))
            console.log(this.data)
            this.emit('init')
          }

        }).catch(function (err) {
          console.error(this.module, err)
        })
      }

    })
    .catch(function (err) {
      console.error(this.module, err)
    })
  } // init

} // Flickr

module.exports = Flickr
