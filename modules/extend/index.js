
"use strict"

const Events = require('events')

class Extend extends Events {

  constructor(options) {
    super()

  }

  // ----- data methods

  dataPush(data) {
    this.data.push(data)
    return true
  } // dataPush

  dataUnlink(data) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === data.filename) {
        this.data.splice(i, 1)
        return true
      }
    }
  } // dataUnlink

  randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

  // ----- delay

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ----- console

  countName(name, n) {
    return (n === 1 ? n + ' ' + name : n + ' ' + name + 's');
  }

  // NEW
  plural(name, n) {
    return (n === 1 ? n + ' ' + name : n + ' ' + name + 's');
  }
  project(value, istart, istop, ostart, ostop) {
  	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart))
  }

  // this.data functions
  unlink(data) {
    for(let i = 0; i < this.data.length; i++) {
      if(this.data[i].filename === data.filename) {
        this.data.splice(i, 1)
        return true
      }
    }
  } // unlink
}

module.exports = Extend
