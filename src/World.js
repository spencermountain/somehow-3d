const htm = require('htm')
const vhtml = require('vhtml')

class World {
  constructor(obj = {}) {
    this.width = 400
    this.height = 300
    this.html = htm.bind(vhtml)
  }
  bind(fn) {
    this.html = htm.bind(fn)
  }
  build() {
    let h = this.html
    return h`<div>hi</div>`
  }
}

module.exports = World
