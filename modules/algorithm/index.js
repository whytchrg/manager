
const Extend   = require('../extend')

class Algorithm extends Extend{

  constructor(options) {
    super()

    this.icon   = '⟖  -  '
    this.module = this.constructor.name

    this.data = []
  }

  rithm(input) {
    console.log(this.icon + this.plural(this.module, input.length) + ' to compute!')

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
        added:    input[i].added,
        tags:     input[i].tags
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

    for(let i = 0; i < this.data.length; i++) { // Tags
      this.data[i].tagVal = 0
      for(let j = 0; j < this.data[i].tags.length; j++) {
        if(this.data[i].tags[j] == "A5") this.data[i].tagVal += 1
        if(this.data[i].tags[j] == "A4") this.data[i].tagVal += 1
        if(this.data[i].tags[j] == "A3") this.data[i].tagVal += 1

        // if(this.data[i].tags[j] == "Japan") this.data[i].tagVal -= 1
        if(this.data[i].tags[j] == "Egypt") this.data[i].tagVal += 1
        if(this.data[i].tags[j] == "India") this.data[i].tagVal += 1
        if(this.data[i].tags[j] == "Nepal") this.data[i].tagVal += 1
        if(this.data[i].tags[j] == "South Korea") this.data[i].tagVal += 1

        // if(this.data[i].tags[j] == "Katharina Trudzinski") this.data[i].tagVal += 1
        if(this.data[i].tags[j] == "Céline Vahsen") this.data[i].tagVal += 1.5
        // if(this.data[i].tags[j] == "hui-hui") this.data[i].tagVal -= 0.5

        if(this.data[i].tags[j] == "home") this.data[i].tagVal -= 1
        if(this.data[i].tags[j] == "Photogram") this.data[i].tagVal += 1

        if(this.data[i].tags[j] == "x") this.data[i].tagVal -= 2
      }
    }

    const tagsMax   = Math.max(...this.data.map(o => o.tagVal))
    const tagsMin   = Math.min(...this.data.map(o => o.tagVal))

    for(let i = 0; i < this.data.length; i++) {

      let rithm = []

      // date
      const dateCreated = this.project(this.data[i].created, createdMin, createdMax, 0.5, 1)      // Date created
      // const dateAdded = this.project(this.data[i].added, addedMin, addedMax, 0.25, 1)              // Date added
      // const date = (dateCreated + dateAdded) / 2
      rithm.push( Math.pow(dateCreated, 1) )

      // views
      const views = this.project(this.data[i].viewScale, viewScaleMin, viewScaleMax, 0, 1)        // Site Views
      rithm.push( Math.pow(views, 1) )

      // flickr
      const flickr = this.project(this.data[i].flickrScale, flickrScaleMin, flickrScaleMax, 0, 1)  // flickr Views
      rithm.push( Math.pow(flickr, 1) )

      // tags
      const tags = this.project(this.data[i].tagVal, tagsMin, tagsMax, 0, 1)                       // Tags
      rithm.push( Math.pow(tags, 1) )

      const result = rithm.reduce( (a,b) => a + b ) / rithm.length
      this.data[i].algorithm = Math.round(result * 1024) //

    }

  }
}

module.exports = Algorithm
