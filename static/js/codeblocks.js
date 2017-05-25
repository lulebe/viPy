window.codeRenderers = {}
window.codeParsers = {}
window.varSelects = []

function randomName() {
    var result = '';
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (var i = 20; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function fillVarSelect(el, selected) {
  var html = ''
  window.program.vars.forEach(function (v) {
    html += '<option value="' + v + '">' + v + '</option>'
  })
  var val = selected || el.val()
  el.html(html)
  el.val(val)
}

function fillVarSelects() {
  var html = ''
  window.program.vars.forEach(function (v) {
    html += '<option value="' + v + '">' + v + '</option>'
  })
  window.varSelects.forEach(function (el) {
    var val = el.val()
    el.html(html)
    el.val(val)
  })
}

function createVarInput (selected) {
  var input = $('<select class="browser-default var-select"></select>')
  window.varSelects.push(input)
  fillVarSelect(input, selected)
  return input
}

function createInputs (data) {
  if (!data)
    data = {type: 'prev'}
  var groupName = randomName()
  var randId1 = randomName()
  var randId2 = randomName()
  var randId3 = randomName()
  var randIdInput = randomName()
  var inputs = $('<section>'
                +'  <div class="radios">'
                +'    <input name="'+groupName+'" type="radio" id="'+randId1+'" value="0" /><label for="'+randId1+'">From previous</label><br>'
                +'    <input name="'+groupName+'" type="radio" id="'+randId2+'" value="1" /><label for="'+randId2+'">Variable</label><br>'
                +'    <input name="'+groupName+'" type="radio" id="'+randId3+'" value="2" /><label for="'+randId3+'">Value</label><br>'
                +'  </div>'
                +'  <div class="fields">'
                +'    <div class="input-field value-input-container"><input type="text" class="value-input" id="'+randIdInput+'" /><label for="'+randIdInput+'">Value</label></div>'
                +'    <div class="var-input" style="padding: 6px;"></div>'
                +'  </div>'
                +'</section>'
                )
  inputs.find('.var-input').html(createVarInput(data.type == 'var' ? data.name : false))
  inputs.find('input[name='+groupName+']').change(function (e) {
    switch (parseInt($(this).val())) {
      case 0:
        inputs.find('.var-input').hide()
        inputs.find('.value-input-container').hide()
        break;
      case 1:
        inputs.find('.var-input').show()
        inputs.find('.value-input-container').hide()
        break;
      case 2:
        inputs.find('.var-input').hide()
        inputs.find('.value-input-container').show()
        break;
    }
  })
  if (!data) {
    inputs.find('#'+randId3).attr('checked', 'checked')
    return inputs
  }
  if (data.type == 'raw') {
    inputs.find('#'+randId3).attr('checked', 'checked')
    inputs.find('.value-input').val(data.value)
    inputs.find('.var-input').hide()
  } else if (data.type == 'prev') {
    inputs.find('#'+randId1).attr('checked', 'checked')
    inputs.find('.value-input-container').hide()
    inputs.find('.var-input').hide()
  } else if (data.type == 'var') {
    inputs.find('#'+randId2).attr('checked', 'checked')
    inputs.find('.value-input-container').hide()
  }
  return inputs
}

function createBlock (imgName, type, title, hasInputs) {
  var base = $('<div class="codeblock" data-type="' + type + '">'
             + '  <div class="codeblock-header">'
             + '    <img src="/static/imgs/' + imgName + '.png" class="codeblock-icon">'
             + '    <span class="codeblock-title">' + title + '</span>'
             + '  </div>'
             + '</div>'
          )
  var deletebtn = $('<i class="material-icons codeblock-headerbtn delete">delete</i>')
  var header = base.find('codeblock-header')
  header.append(deletebtn)
  deletebtn.one('click', function () {
    var el = $(this).parents('.codeblock')
    el.next().remove()
    el.remove()
  })
  if (!hasInputs)
    return base
  var inputs = $('<div class="codeblock-inputs"></div>')
  base.append(inputs)
  var expandbtn = $('<i class="material-icons codeblock-headerbtn">keyboard_arrow_down</i>')
  expandbtn.click(function () {
    $(this).parents('.codeblock').find('.codeblock-inputs').toggleClass('visible')
    $(this).toggleClass('expanded')
  })
  base.find('.codeblock-title').after(expandbtn)
  return base
}


window.codeRenderers.VAR_SET = function (el, block) {
  var content = createBlock('icon_terminal', 'VAR_SET', 'Store to Variable', true)
  var nameInput = createVarInput(block.name)
  nameInput.addClass('name')
  var nameInputContainer = $('<section style="margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #aaa; align-items: center;"><div>Var to set:</div><div class="fields"></div></section>')
  content.find('.codeblock-inputs').html(nameInputContainer)
  nameInputContainer.find('.fields').html(nameInput)
  var inputs = createInputs(block.data)
  inputs.find('.var-select').addClass('value')
  content.find('.codeblock-inputs').append(inputs)
  el.after(content)
  return {el: content, returns: true}
}

window.codeParsers.VAR_SET = function (el, code) {
  var type = el.find('input[type="radio"]:checked').next().text()
  var data
  if (type == 'From previous')
    data = {type: 'prev'}
  else if (type == 'Value')
    data = {type: 'raw', value: el.find('.value-input').val()}
  else if (type == 'Variable')
    data = {type: 'var', name: el.find('.var-select.value').val()}
  var varName = el.find('.var-select.name').val()
  code.push({type: 'VAR_SET', name: varName, data: data})
}


window.codeRenderers.CONSOLE_OUT = function (el, block) {
  var content = createBlock('icon_terminal', 'CONSOLE_OUT', 'Console Output', true)
  var inputs = createInputs(block.data)
  content.find('.codeblock-inputs').html(inputs)
  el.after(content)
  return {el: content, returns: false}
}
window.codeParsers.CONSOLE_OUT = function (el, code) {
  var type = el.find('input[type="radio"]:checked').next().text()
  var data
  if (type == 'From previous')
    data = {type: 'prev'}
  else if (type == 'Value')
    data = {type: 'raw', value: el.find('.value-input').val()}
  else if (type == 'Variable')
    data = {type: 'var', name: el.find('.var-select').val()}
  code.push({type: 'CONSOLE_OUT', data: data})
}


window.codeRenderers.CONSOLE_IN = function (el, block) {
  var content = createBlock('icon_terminal', 'CONSOLE_IN', 'Console Input', false)
  el.after(content)
  return {el: content, returns: true}
}
window.codeParsers.CONSOLE_IN = function (el, code) {
  code.push({type: 'CONSOLE_IN'})
}


window.codeRenderers.WAIT = function (el, block) {
  var content = createBlock('pause', 'WAIT', 'Wait', true)
  var inputs = createInputs(block.data)
  content.find('.codeblock-inputs').html(inputs)
  el.after(content)
  return {el: content, returns: false}
}
window.codeParsers.WAIT = function (el, code) {
  var type = el.find('input[type="radio"]:checked').next().text()
  var data
  if (type == 'From previous')
    data = {type: 'prev'}
  else if (type == 'Value')
    data = {type: 'raw', value: el.find('.value-input').val()}
  else if (type == 'Variable')
    data = {type: 'var', name: el.find('.var-select').val()}
  code.push({type: 'WAIT', data: data})
}


window.codeRenderers.CODE = function (el, block) {
  var content = createBlock('pause', 'CODE', 'Python code', true)
  content.find('.codeblock-inputs').html('<textarea style="font-family: monospace">' + block.code || '' + '</textarea>')
  el.after(content)
  return {el: content, returns: false}
}
window.codeParsers.CODE = function (el, code) {
  var c = el.find('textarea').val()
  code.push({type: 'CODE', code: c})
}


window.codeRenderers.IF_ELSE = function (el, block) {
  var content = createBlock('pause', 'IF_ELSE', 'If/Else', true)
  var inputs = createInputs(block.data)
  content.find('.codeblock-inputs').html(inputs)
  content.find('.codeblock-inputs').append('<section class="subblock"><div class="code-connector next"></div></section>')
  el.after(content)
  return {el: content, returns: false}
}
window.codeParsers.IF_ELSE = function (el, code) {
  var type = el.find('input[type="radio"]:checked').next().text()
  var data
  if (type == 'From previous')
    data = {type: 'prev'}
  else if (type == 'Value')
    data = {type: 'raw', value: el.find('.value-input').val()}
  else if (type == 'Variable')
    data = {type: 'var', name: el.find('.var-select').val()}
  code.push({type: 'IF_ELSE', data: data})
}
