
"use strict"

const Tinysort = require('tinysort')

class Display{

  constructor(options) {

    this.path       = options.path
    this.thumbnails = options.thumbnails
    this.extension  = options.extension
    this.thumbSize  = 62

    this.data = []
  } // constructor

  init(data) {
    // console.log(data[0])

    const main = document.querySelector('body main')

    let x = main.querySelectorAll('article') // cler main
    for(let i = 0; i < x.length; i++) {
      x[i].parentNode.removeChild(x[i])
    }

    const raw = document.querySelector('body main template').content.querySelector('article')
    for(let i = 0; i < data.length; i++) {
      const template = document.importNode(raw, true)

      let table = template.querySelector('table')

      let img = template.querySelector('img')

      let width  = Math.round(this.thumbSize * Math.SQRT2)
      let height = this.thumbSize

      template.dataset.filename    = data[i].filename
      template.dataset.created     = data[i].created
      template.dataset.added       = data[i].added
      template.dataset.modified    = data[i].modified
      template.dataset.updated     = data[i].updated
      template.dataset.views       = data[i].views_mysql.length
      template.dataset.flickrViews = data[i].views_flickr.length
      template.dataset.orientation = data[i].orientation

      template.style.borderBottom = '1px solid #aaa'
      template.style.marginBottom = '4px'

      table.rows[0].cells[2].innerHTML = data[i].filename
      table.rows[0].cells[4].innerHTML = this.strDate(data[i].created)
      table.rows[1].cells[3].innerHTML = this.strDate(data[i].added * 1000)
      table.rows[2].cells[1].innerHTML = data[i].views_mysql.length
      table.rows[2].cells[3].innerHTML = this.strDate(data[i].modified)
      table.rows[3].cells[1].innerHTML = data[i].views_flickr.length
      table.rows[3].cells[3].innerHTML = this.strDate(data[i].updated)

      table.rows[0].cells[0].style.width = width + 'px';

      img.src = this.path + this.thumbnails + '/' + data[i].filename.split('.').slice(0, -1).join('.') + this.extension
      // img.style.maxWidth  = '100px'
      img.style.maxHeight = height + 'px'

      main.appendChild(template)
      // this.data.push(template)
    }

    const article = main.querySelectorAll('article')

    tinysort.defaults.order = 'desc'
    tinysort(article ,{ data: 'created' })

  } // init

  strDate(int) {
    let date = new Date(int)

    const year    = date.getFullYear()
    const month   = this.zeroPad(date.getMonth() + 1)
    const day     = this.zeroPad(date.getDate())
    const hour    = this.zeroPad(date.getHours())
    const minutes = this.zeroPad(date.getMinutes())
    const seconds = this.zeroPad(date.getSeconds())
    const string = hour + ':' + minutes + ':' + seconds + ' ' + day + '.' + month + '.' + year
    return string
  } // makeDate

  zeroPad(int, length = 2) {
    var zero = length - int.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + int;
  }

} // Display

module.exports = Display
