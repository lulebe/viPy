const Server = require('http').Server
const express = require('express')
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser')
const makePath = require('path').resolve

const htmlRoutes = require('./nodeapp/htmlroutes')
const apiRoutes = require('./nodeapp/apiroutes')
const sockets = require('./nodeapp/sockets')


const app = express()

nunjucks.configure(makePath(__dirname, 'templates'), {
  autoescape: false,
  express: app
})

app.use('/static', express.static(makePath(__dirname, 'static')))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(htmlRoutes)
app.use(apiRoutes)

const server = Server(app)

sockets.init(server)

server.listen(8000)