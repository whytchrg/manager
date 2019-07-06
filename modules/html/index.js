
"use strict"

const Extend = require('../extend')

class Html extends Extend {

  constructor(options) {
    super()

    this.init(options)
  } // constructor

  init(options) {

    this.scale()
    this.resize()
  } // init

  scale() {
    const height = window.innerHeight

    const nav    = document.querySelector('body nav')
    const main   = document.querySelector('body main')

    const minus = nav.clientHeight + nav.offsetTop * 2
    main.style.height = (height - minus * 2 - nav.offsetTop / 2) + 'px'
  } // scale

  resize() {
    window.addEventListener('resize', () => {
      this.scale()
    })
  } // resize

} // Html

module.exports = Html
