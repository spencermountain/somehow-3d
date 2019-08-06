const somehow3d = require('./src')

let w = somehow3d({})

w.text('cool!')
w.rect()
w.line()

document.querySelector('#stage').appendChild(w.build())

w.run()
