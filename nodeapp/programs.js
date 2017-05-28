const makePath = require('path').resolve
const fs = require('fs')
const spawn = require('child_process').spawn

const sockets = require('./sockets')
const compiler = require('./compiler')

const programPath = makePath(__dirname, '../programs')

module.exports = {
  listAll,
  getProgramJson,
  saveProgram,
  createProgram,
  deleteProgram,
  renameProgram,
  getCode,
  compileProgram,
  runProgram
}

function listAll (cb) {
  fs.readdir(programPath, (err, files) => {
    if (err)
      cb(err)
    else
      cb(null, files.filter(file => file != 'compiled').filter(file => file.substr(0, 1) != '.').map(file => file.replace('.json', '')).sort())
  })
}

function getProgramJson (name, cb) {
  const path = makePath(programPath, name+'.json')
  fs.readFile(path, 'utf8', cb)
}

function saveProgram(name, data, cb) {
  const path = makePath(programPath, name+'.json')
  fs.writeFile(path, data, cb)
}

function createProgram (name, cb) {
    saveProgram(name, '{"vars": [], "code": []}', cb)
}

function deleteProgram (name, cb) {
  const path = makePath(programPath, name+'.json')
  fs.unlink(path, cb)
}

function renameProgram (oldname, newname, cb) {
  var oldpath = makePath(programPath, oldname+'.json')
  var newpath = makePath(programPath, newname+'.json')
  fs.rename(oldpath, newpath, cb)
}

function getCode (name, cb) {
  const path = makePath(programPath, 'compiled', name+'.py')
  fs.readFile(path, 'utf8', cb)
}

function compileProgram (name, cb) {
  const inPath = makePath(programPath, name+'.json')
  const outPath = makePath(programPath, 'compiled', name+'.py')
  compiler.compileFile(inPath, outPath, cb)
}

function runProgram (name, cb) {
  compileProgram(name, err => {
    if (err) {
      cb(err)
      return
    }
    executePython(makePath(programPath, 'compiled', name.replace(/ /, '\\ ')+'.py'))
    cb(null)
  })
}

function executePython (path) {
  const process = spawn('python3 '+path, {shell: true, stdio: 'pipe'})
  process.on('close', () => {
    sockets.setStdinHandler(null)
    sockets.setTerminateHandler(null)
    sockets.sendStdout('Program has finished.')
  })
  process.on('error', () => {
    sockets.setStdinHandler(null)
    sockets.setTerminateHandler(null)
    sockets.sendStdout('Program has finished.')
  })
  sockets.setTerminateHandler(process.kill)
  sockets.setStdinHandler(data => {
    process.stdin.write(data+'\n')
  })
  process.stdout.on('data', data => {
    console.log('stdout')
    console.log(data.toString('utf8'))
    sockets.sendStdout(data.toString('utf8'))
  })
  process.stderr.on('data', data => {
    console.log('stderr')
    console.log(data.toString('utf8'))
  })
}