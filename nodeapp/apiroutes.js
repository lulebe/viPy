const Router = require('express').Router()

const programs = require('./programs')

module.exports = Router

Router.post('/api/saveprogram/:name', saveProgram)
Router.get('/api/runprogram/:name', runProgram)
Router.get('/api/programcode/:name', getProgramCode)

function saveProgram(req, res) {
  programs.saveProgram(req.params.name, JSON.stringify(req.body), err => {
    if (err)
      return res.status(500).send(err.message)
    res.status(200).end()
  })
}

function runProgram(req, res) {
  programs.runProgram(req.params.name, err => {
    if (err)
      return res.status(500).send(err.message)
    res.status(200).end()
  })
}

function getProgramCode(req, res) {
  programs.compileProgram(req.params.name, err => {
    if (err)
      return res.status(500).send(err.message)
    programs.getCode(req.params.name, (err, code) => {
      if (err)
        return res.status(500).send(err.message)
      res.status(200).send(code)
    })
  })
}