const Router = require('express').Router()
const nis = require('os').networkInterfaces()

function getIp () {
  var ip = []
  for(var k in nis) {
    var inter = nis[k]
    for(var j in inter)
      if(inter[j].family === 'IPv4' && !inter[j].internal)
        return inter[j].address
  }
}

const programs = require('./programs')

module.exports = Router

Router.get('/', allPrograms)
Router.get('/new', newProgramPage)
Router.post('/new', createProgram)
Router.get('/program/:name', showProgram)
Router.get('/deleteprogram/:name', deleteProgram)
Router.post('/renameprogram', renameProgram)
Router.get('/tut', renderTutorial)


function allPrograms (req, res) {
  programs.listAll((err, progList) => {
    if (err)
      return res.status(500).send()
    res.render('index.html', {programs: progList, noPrograms: progList.length == 0, ip: getIp()})
  })
}

function newProgramPage (req, res) {
  res.render('newProgram.html')
}

function createProgram(req, res) {
  programs.createProgram(req.body.name, err => {
    if (err)
      return res.status(500).send(err.message)
    res.redirect('/program/'+req.body.name)
  })
}

function showProgram (req, res) {
  programs.getProgramJson(req.params.name, (err, progJson) => {
    if (err)
      return res.status(500).send(err.message)
    res.render('program.html', {programJson: progJson.replace(/\n/g, ''), name: req.params.name})
  })
}

function deleteProgram (req, res) {
  programs.deleteProgram(req.params.name, err => {
    if (err)
      return res.status(500).send(err.message)
    res.redirect('/')
  })
}

function renameProgram (req, res) {
  programs.renameProgram(req.body.program, req.body.name, err => {
    if (err)
      return res.status(500).send(err.message)
    res.redirect('/')
  })
}

function renderTutorial (req, res) {
  res.render('tutorial.html')
}