
"use strict"

const Extend    = require('../extend')
const flickr    = require('flickr-sdk')                 // Flickr

class Flickr extends Extend {

  constructor(options) {
    super()

    this.module = this.constructor.name
    this.icon   = '𝕱  -  '

    this.client = new flickr(options.apikey);

    this.data = []

    this.init(options)
  }

  init(options) {

    this.client.people.getInfo({
      user_id: options.userid

    }).then((result) => {

      const count = result.body.person.photos.count._content
      const a = Math.ceil(result.body.person.photos.count._content/500)
      const raw = []
      for(let i = 0; i < a; i++) {
        this.client.people.getPublicPhotos({
          user_id: options.userid,
          extras: ['date_upload', 'date_taken', 'last_update', 'tags', 'views'],
          page: i + 1,
          per_page: 500
        }).then((result) => {
          result.body.photos.photo.forEach((element) => {
            const data = this.metadata(element)
            this.data.push(data)
          })
          if(count == this.data.length) {
            console.log(this.icon + this.countName(this.module, this.data.length))
            // console.log(this.data)
            this.emit('init')
          }
        }).catch((err) => {
          console.error(this.module, err)
        })
      }
    })
    .catch((err) => {
      console.error(this.module, err)
    })
  } // init

  metadata(raw) {


    const data = {
      name: raw.title,
      added: parseInt(raw.dateupload, 10),
      views: parseInt(raw.views, 10)
    }

    return data
  } // metadata

  fetch() {
    // setTimeout(() => {

    // }, 1)
    this.data.forEach(() => {
      // this.client.photos.getInfo({
      //   photo_id: element.id,
      //   secret: element.secret
      // }).then(function (result) {
      //   this.flickr.push(result.body.photo)
      // }.bind(this)).catch(function (err) {
      //   console.error('bonk', err)
      // })
    })
  } // fetch

} // Flickr

module.exports = Flickr
