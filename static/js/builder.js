//socketio
var socket = io('http://'+window.location.hostname+':8000')
socket.on('connect', function () {
  $('#console ul').append('<li class="info">Connected to server.</li>')
})
socket.on('stdout', function (data) {
  if (data.substr(0, 19) == '__RECEIVING_INPUT__') {
    $('#console ul').append('<li class="info inputinfo">Waiting for input: <span class="blinker"></span></li>')
    return
  }
  var style = data == 'Program has finished.' ? 'info' : 'output'
  data == 'Program has finished.' && $('#cin').blur() && $('#runBtn').show() && $('#stopBtn').hide() && $('.console-wrapper').removeClass('running') && $('#runInd').hide()
  $('#console ul').append('<li class="' + style + '">' + data + '</li>')
})
socket.on('disconnect', function () {
  $('#console ul').append('<li class="info">Disconnected from server.</li>')
})

renderProgram()


$('#blocksCollapsible').collapsible();

$('.draggableBlock').on('dragstart', function (e) {
  e.stopPropagation()
  $(this).addClass('is-dragged')
  e.originalEvent.dataTransfer.setData('application/json', JSON.stringify({type: this.dataset.codetype}))
})
$('.draggableBlock').on('dragend', function (e) {
  $(this).removeClass('is-dragged')
})
$('.code-connector').on('dragenter', dragenter)
$('.code-connector').on('dragleave', dragleave)
$('.code-connector').on('dragover', dragover)
$('.code-connector').on('drop', drop)

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
  console.log('drop')
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
  connector.on('dragenter', dragenter)
  connector.on('dragleave', dragleave)
  connector.on('dragover', dragover)
  connector.on('drop', drop)
  deletebtn.one('click', deleteBlock)
}

function deleteBlock (e) {
  var el = $(this).parents('.codeblock')
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
    // TODO investigate
    //connector.on('drop', drop)
    deletebtn.one('click', deleteBlock)
    curEl = connector
  })
}

function parseToProgram () {
  window.program = {code: []}
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
  $('#stopBtn').show()
  $('#cin').focus()
  $('#console li').remove()
  $.get('/api/runprogram/'+window.programName)
}

function saveAndRunProgram () {
  saveProgram(runProgram)
}

$('#saveBtn').click(function () {saveProgram(function () {})})
$('#runBtn').click(saveAndRunProgram)
