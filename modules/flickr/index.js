
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

  async init(options) {
    const start = Date.now()

    this.data = await this.publicPhotos(options)

    // console.log(this.data[0])
    console.log(this.icon + this.plural(this.module, this.data.length) + ' / ' + this.plural('second', ((Date.now() - start) / 1000)) )
    this.emit('init')
  } // init

  publicPhotos(options) {
    return new Promise((resolve, reject) => {

      this.client.people.getInfo({
        user_id: options.userid

      }).then((result) => {

        const count = result.body.person.photos.count._content
        const a = Math.ceil(result.body.person.photos.count._content/500)
        const raw = []
        for(let i = 0; i < a; i++) {
          this.client.people.getPublicPhotos({
            user_id: options.userid,
            extras: ['date_upload', 'views'],
            page: i + 1,
            per_page: 500
          }).then((result) => {
            result.body.photos.photo.forEach((element) => {
              const data = this.metadata(element)
              raw.push(data)
            })
            if(count == raw.length) {
              resolve(raw)
            }
          }).catch((err) => {
            console.error(this.module + ' A', err)
          })
        }
      })
      .catch((err) => {
        console.error(this.module + ' B', err)
      })
    })
  }

  metadata(raw) {
    const data = {
      name: raw.title,
      added: parseInt(raw.dateupload, 10),
      views: parseInt(raw.views, 10),
      favs: false,
      id: raw.id,
      secret: raw.secret
    }
    return data
  } // metadata

  // fetch() {
  //   // setTimeout(() => {
  //
  //   // }, 1)
  //   this.data.forEach((element) => {
  //     this.client.photos.getInfo({
  //       photo_id: element.id,
  //       secret: element.secret
  //     }).then(function (result) {
  //       this.flickr.push(result.body.photo)
  //     }.bind(this)).catch(function (err) {
  //       console.error('bonk', err)
  //     })
  //   })
  // } // fetch

} // Flickr

module.exports = Flickr
