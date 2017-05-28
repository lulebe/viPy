const socketio = require('socket.io')

const sockets = []

var io = null
var stdinHandler = null
var terminateHandler = null

module.exports = {
  init: server => {
    io = socketio(server)
    io.on('connection', addSocket)
  },
  setStdinHandler: cb => {
    stdinHandler = cb
  },
  setTerminateHandler: cb => {
    terminateHandler = cb
  },
  sendStdout: data => {
    io.sockets.emit('stdout', data)
  }
}

function addSocket (socket) {
  sockets.push(socket)
  socket.on('disconnect', () => {
    sockets.splice(sockets.indexOf(socket), 1)
  })
  socket.on('stdin', data => {
    if (stdinHandler)
      stdinHandler(data)
  })
  socket.on('terminate', () => {
    if (terminateHandler)
      terminateHandler()
  })
}