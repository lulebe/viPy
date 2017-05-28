const Server = require('http').Server
const express = require('express')
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser')

const htmlRoutes = require('./nodeapp/htmlroutes')
const apiRoutes = require('./nodeapp/apiroutes')
const sockets = require('./nodeapp/sockets')


const app = express()

nunjucks.configure('templates', {
  autoescape: false,
  express: app
})

app.use('/static', express.static('./static'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(htmlRoutes)
app.use(apiRoutes)

const server = Server(app)

sockets.init(server)

server.listen(8000)