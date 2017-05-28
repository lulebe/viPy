//socketio
var socket = io('http://'+window.location.hostname+':8000')
socket.on('connect', function () {
  $('#console ul').append('<li class="info">Connected to server.</li>')
})
socket.on('stdout', function (data) {
  if (data.indexOf('__RECEIVING_INPUT__') != -1) {
    $('#console ul').append('<li class="info inputinfo">Waiting for input: <span class="blinker"></span></li>')
    return
  }
  var style = data == 'Program has finished.' ? 'info' : 'output'
  data == 'Program has finished.' && finishedExecution()
  $('#console ul').append('<li class="' + style + '">' + data + '</li>')
})
socket.on('stderr', function (data) {
  $('#console ul').append('<li class="error">' + data + '</li>')
})
socket.on('disconnect', function () {
  $('#console ul').append('<li class="info">Disconnected from server.</li>')
  finishedExecution()
})

renderProgram()


$('#blocksCollapsible').collapsible();

$('.draggableBlock').on('dragstart', function (e) {
  e.stopPropagation()
  $(this).addClass('is-dragged')
  e.originalEvent.dataTransfer.setData('application/json', JSON.stringify({type: this.dataset.codetype}))
})
$('.draggableBlock').click(function () {
  $('.click-selected-dragblock').removeClass('click-selected-dragblock')
  $(this).addClass('click-selected-dragblock')
})
$('.draggableBlock').on('dragend', function (e) {
  $(this).removeClass('is-dragged')
})
$('.code-connector').on('dragenter', dragenter)
$('.code-connector').on('dragleave', dragleave)
$('.code-connector').on('dragover', dragover)
$('.code-connector').on('drop', drop)
$('.code-connector').on('click', clickConnector)

$('#clearConsole').click(function () {
  $('#console li').remove()
})

$('#helpConsole').click(function () {
  $('#console ul').append('<li class="info">'
                          + 'You can interact with your program here.'
                          + '</li><li class="output">'
                          + 'Output from your code will be green.'
                          + '</li><li class="info">'
                          + 'Use the "help" button to show this info again.'
                          + '</li><li class="info">'
                          + 'Use the "delete" button to remove all text in the console.'
                          + '</li>')
})

$('#closeConsoleBtn').click(function () {
  $('body').toggleClass('console-closed')
})

$('#cinForm').on('submit', function(e) {
  e.preventDefault()
  var val = $('#cin').val()
  if (val == 'run')
    saveAndRunProgram()
  else {
    socket.emit('stdin', val)
    var lc = $('#console ul :last-child')
    if (lc.hasClass('inputinfo')) {
      lc.find('.blinker').remove()
      lc.append('<span class="input">' + val + '</span>')
    }
  }
  $('#cin').val('')
})

$('#runInd').hide()
$('#stopBtn').hide()
$('#stopBtn').click(function () {
  socket.emit('terminate', null)
})


$('#modalVar').modal()
$('#addVarBtn').click(function () {
  $('#modalVar').modal('open')
})
$('#varForm').on('submit', function (e) {
  e.preventDefault()
  var varName = $('#addVarInput').val()
  window.program.vars.push(varName)
  fillVarSelects()
  var content = $('<li class="collection-item" data-varname="' + varName + '"><div>' + varName + '<span class="secondary-content"><i class="material-icons codeblock-headerbtn delete">delete</i></span></div></li>')
  $('#varInsertPoint').after(content)
  content.find('.delete').one('click', function () {
    var block = $(this).parents('.collection-item')
    var i = window.program.vars.indexOf(block.data('varname'))
    if (i >= 0)
      window.program.vars.splice(i, 1)
    fillVarSelects()
    block.remove()
  })
})


function dragenter (e) {
  $(this).addClass('dropping-into')
}

function dragleave (e) {
  $(this).removeClass('dropping-into')
}

function dragover (e) {
  e.preventDefault()
}

function drop (e) {
  e.stopPropagation()
  $(this).removeClass('dropping-into')
  var data = JSON.parse(e.originalEvent.dataTransfer.getData('application/json'))
  var inserted = window.codeRenderers[data.type]($(this), data)
  var connector = $('<div class="code-connector next'
                    + (inserted.returns ? ' has-return-value' : '')
                    + '"></div>')
  var deletebtn = $('<i class="material-icons codeblock-headerbtn delete">delete</i>')
  inserted.el.after(connector)
  inserted.el.find('.codeblock-header').append(deletebtn)
  connectors = connector.add(inserted.el.find('.code-connector'))
  connectors.on('dragenter', dragenter)
  connectors.on('dragleave', dragleave)
  connectors.on('dragover', dragover)
  connectors.on('drop', drop)
  connectors.on('click', clickConnector)
  deletebtn.one('click', deleteBlock)
}

function clickConnector () {
  var block = $('.click-selected-dragblock')
  block.removeClass('click-selected-dragblock')
  if (block.length == 0)
    return
  var data = {type: block[0].dataset.codetype}
  var inserted = window.codeRenderers[data.type]($(this), data)
  var connector = $('<div class="code-connector next'
                    + (inserted.returns ? ' has-return-value' : '')
                    + '"></div>')
  var deletebtn = $('<i class="material-icons codeblock-headerbtn delete">delete</i>')
  inserted.el.after(connector)
  inserted.el.find('.codeblock-header').append(deletebtn)
  connectors = connector.add(inserted.el.find('.code-connector'))
  connectors.on('dragenter', dragenter)
  connectors.on('dragleave', dragleave)
  connectors.on('dragover', dragover)
  connectors.on('drop', drop)
  connectors.on('click', clickConnector)
  deletebtn.one('click', deleteBlock)
}

function deleteBlock (e) {
  var el = $(this).parents('.codeblock')
  el.find('.var-select').each(function (vs) {
    var i = window.varSelects.indexOf(vs)
    if (i >= 0)
      window.varSelects.splice(i, 1)
  })
  el.next().remove()
  el.remove()
}


function renderProgram () {
  var program = window.program
  /*
    recursively go through each code block and subblocks
    insert blocks of correct type (function array for type lookup)
    wire up events
    use "has-return-value" arrows and "stop"/"next" arrows accordingly
    "stop" if block index == blocks.length-1, else "next"
    "has-return-value" depending on block, defined by looked up function retval
  */
  //render Vars
  program.vars.forEach(function (varName) {
    var content = $('<li class="collection-item" data-varname="' + varName + '"><div>' + varName + '<span class="secondary-content"><i class="material-icons codeblock-headerbtn delete">delete</i></span></div></li>')
    $('#varInsertPoint').after(content)
    content.find('.delete').one('click', function () {
      var block = $(this).parents('.collection-item')
      var i = window.program.vars.indexOf(block.data('varname'))
      if (i >= 0)
        window.program.vars.splice(i, 1)
      block.remove()
    })
  })
  renderCodeblocks($('.code-connector.first'), program.code, true)
}

function renderCodeblocks (el, blocks, root) {
  var curEl = el
  blocks.forEach(function (block, index) {
    var created = window.codeRenderers[block.type](curEl, block)
    var connector = $('<div class="code-connector'
                      + (index == blocks.length-1 && !root ? ' stop' : ' next')
                      + (created.returns ? ' has-return-value' : '')
                      + '"></div>')
    var deletebtn = $('<i class="material-icons codeblock-headerbtn delete">delete</i>')
    created.el.after(connector)
    created.el.find('.codeblock-header').append(deletebtn)
    connector.on('dragenter', dragenter)
    connector.on('dragleave', dragleave)
    connector.on('dragover', dragover)
    deletebtn.one('click', deleteBlock)
    curEl = connector
  })
}

function parseToProgram () {
  window.program.code = []
  $('#codeBuilder').children('.codeblock').each(function (i, child) {
    if (child.dataset.type != 'START' && child.dataset.type != 'END')
    window.codeParsers[child.dataset.type]($(child), window.program.code)
  })
}

function saveProgram (cb) {
  parseToProgram()
  $.ajax({
    method: 'POST',
    url: '/api/saveprogram/'+window.programName,
    data: JSON.stringify(window.program),
    contentType: "application/json",
    dataType: "json"
  })
  .always(function () {
    $('#console ul').append('<li class="info">Saved</li>')
    cb()
  })
}

function runProgram () {
  $('#runInd').show()
  $('.console-wrapper').addClass('running')
  $('#runBtn').hide()
  $('#codeBtn').hide()
  $('#stopBtn').show()
  $('#cin').focus()
  $('#console li').remove()
  $.get('/api/runprogram/'+window.programName)
}

function showCode () {
  $.get('/api/programcode/'+window.programName, function (data) {
    var html = Prism.highlight(data, Prism.languages.python)
    html = html.replace(/(?:\r\n|\r|\n)/g, '<br />')
    $('#console li').remove()
    $('#console ul').append('<li class="info">Program Code:</li>')
    $('#console ul').append('<li class="output"><pre><code class="language-python">' + html + '</code></pre></li>')
  })
}

function saveAndRunProgram () {
  saveProgram(runProgram)
}

function saveAndShowcode () {
  saveProgram(showCode)
}

function finishedExecution () {
  $('#cin').blur()
  $('#runBtn').show()
  $('#codeBtn').show()
  $('#stopBtn').hide()
  $('.console-wrapper').removeClass('running')
  $('#runInd').hide()
}

$('#saveBtn').click(function () {saveProgram(function () {})})
$('#runBtn').click(saveAndRunProgram)
$('#codeBtn').click(saveAndShowcode)