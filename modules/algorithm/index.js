const Extend   = require('../extend')
require('../math')

class Algorithm extends Extend{

  constructor(options) {
    super()

    this.icon   = '⟖  -  '
    this.module = this.constructor.name

    this.data = []
  }

  rithm(input) {
    console.log(this.icon + this.countName(this.module, input.length) + ' to compute!')

    const now = new Date().getTime() / 1000

    const createdMax     = Math.max(...input.map(o => o.created))
    const createdMin     = Math.min(...input.map(o => o.created))

    const addedMax       = Math.max(...input.map(o => o.added))
    const addedMin       = Math.min(...input.map(o => o.added))

    const updatedMax     = Math.max(...input.map(o => o.updated))
    const updatedMin     = Math.min(...input.map(o => o.updated))

    const viewsMysqlMax  = Math.max(...input.map(o => o.views_mysql.length))
    const viewsMysqlMin  = Math.min(...input.map(o => o.views_mysql.length))

    const viewsFlickrMax = Math.max(...input.map(o => o.views_flickr.length))
    const viewsFlickrMin = Math.min(...input.map(o => o.views_flickr.length))

    for(let i = 0; i < input.length; i++) {
      this.data[i] = {
        filename: input[i].filename,
        created:  input[i].created,
        modified: input[i].modified,
        updated:  input[i].updated,
        added:    input[i].added
      }

      let viewScale = []
      for (let j = 0; j < input[i].views_mysql.length; j++) {
        const scale = (input[i].views_mysql[j].server - addedMin) / (now - addedMin)
        viewScale.push( Math.pow(scale, 16) )
      }
      this.data[i].viewScale = viewScale.reduce((a, b) => a + b, 0)

      let flickrScale = []
      for (let j = 0; j < input[i].views_flickr.length; j++) {
        const scale = (input[i].views_flickr[j].server - addedMin) / (now - addedMin)
        flickrScale.push( Math.pow(scale, 16) )
      }
      this.data[i].flickrScale = flickrScale.reduce((a, b) => a + b, 0)

    }

    const viewScaleMax   = Math.max(...this.data.map(o => o.viewScale))
    const viewScaleMin   = Math.min(...this.data.map(o => o.viewScale))

    const flickrScaleMax = Math.max(...this.data.map(o => o.flickrScale))
    const flickrScaleMin = Math.min(...this.data.map(o => o.flickrScale))

    for(let i = 0; i < this.data.length; i++) {

      // created
      const a = Math.map(this.data[i].created, createdMin, createdMax, 0.5, 1)

      // views
      // const b = Math.map(this.data[i].views_mysql.length, viewsMin, viewsMax, 0, 1)
      const b = Math.map(this.data[i].viewScale, viewScaleMin, viewScaleMax, 0, 1)

      // flickr views
      // const c = Math.map(this.data[i].views_flickr.length, viewsFlickrMin, viewsFlickrMax, 0, 1)
      const c = Math.map(this.data[i].flickrScale, flickrScaleMin, flickrScaleMax, 0, 1)

      // const result = (Math.pow(a, 1/200) + Math.pow(b, 1) * 4 + Math.pow(c, 1) * 4) / 9 //
      const result = (a * 0.1) + (Math.pow(b, 0.8) * 0.45) + (Math.pow(c, 0.4) * 0.45)
      this.data[i].algorithm = Math.round(result * 10000000000) / 10000000000 //

    }

    const algorithmMax = Math.max(...this.data.map(o => o.algorithm))
    const algorithmMin = Math.min(...this.data.map(o => o.algorithm))

    console.log("Min: " + algorithmMin + " Max: " + algorithmMax)

  }
}

module.exports = Algorithm
