
"use strict"

const Extend = require('../extend')
const Tinysort = require('tinysort')

class Display extends Extend {

  constructor(options) {
    super()

    this.path       = options.path
    this.thumbnails = options.thumbnails
    this.extension  = options.extension
    this.thumbSize  = 62

  } // constructor

  init(data) {
    console.log(data[0])

    document.getElementById('loader').style.display = 'block'

    const main = document.querySelector('body main')
    let article = main.querySelectorAll('article')

    for(let i = 0; i < article.length; i++) {
      article[i].parentNode.removeChild(article[i])
    }

    const raw = document.querySelector('body main template').content.querySelector('article')

    let loaded = []

    console.log(raw)
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
      template.dataset.views       = data[i].views_mysql.length
      template.dataset.flickrViews = data[i].views_flickr.length
      template.dataset.orientation = data[i].orientation
      template.classList.add('isvisible')
      template.classList.add('hidden')
      template.style.borderBottom = '1px solid #aaa'
      template.style.marginBottom = '4px'

      table.rows[0].cells[2].innerHTML = data[i].filename
      table.rows[0].cells[4].innerHTML = this.strDate(data[i].created)
      table.rows[1].cells[3].innerHTML = this.strDate(data[i].added * 1000)
      table.rows[2].cells[1].innerHTML = data[i].views_mysql.length
      table.rows[2].cells[3].innerHTML = this.strDate(data[i].modified)
      table.rows[3].cells[1].innerHTML = data[i].views_flickr.length

      table.rows[0].cells[0].style.width = width + 'px';

      loaded.push(img.onload = () => { return true })

      img.src = this.path + this.thumbnails + '/' + data[i].filename.split('.').slice(0, -1).join('.') + this.extension
      // img.style.maxWidth  = '100px'
      img.style.maxHeight = height + 'px'

      main.appendChild(template)

    }

    article = main.querySelectorAll('article')

    tinysort.defaults.order = 'desc'
    tinysort(article ,{ data: 'created' })

    Promise.all(loaded)
      .then(() => {
        for(let i = 0; i < article.length; i++) {
          article[i].classList.add('isvisible')
        }
        document.getElementById('loader').style.display = 'none'
      })

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
