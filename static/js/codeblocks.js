window.codeRenderers = {}
window.codeParsers = {}
window.varSelects = []

function randomName() {
    var result = '';
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (var i = 20; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function createInputs (data) {
  var groupName = randomName()
  var randId1 = randomName()
  var randId2 = randomName()
  var randId3 = randomName()
  var randIdInput = randomName()
  var inputs = $('<div class="radios">'
                +'  <input name="'+groupName+'" type="radio" id="'+randId1+'" value="0" /><label for="'+randId1+'">From previous</label><br>'
                +'  <input name="'+groupName+'" type="radio" id="'+randId2+'" value="1" /><label for="'+randId2+'">Variable</label><br>'
                +'  <input name="'+groupName+'" type="radio" id="'+randId3+'" value="2" /><label for="'+randId3+'">Value</label><br>'
                +'</div>'
                +'<div class="fields">'
                +'  <div class="input-field value-input-container"><input type="text" class="value-input" id="'+randIdInput+'" /><label for="'+randIdInput+'">Value</label></div>'
                +'  <div class="var-input" style="padding: 6px;"><select class="browser-default var-select"></select></div>'
                +'</div>'
                )
  window.varSelects.push(inputs.find('.var-select')[0])
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
    inputs.find('#'+randIn1).attr('checked', 'checked')
    inputs.find('.value-input-container').hide()
    inputs.find('.var-input').hide()
  } else if (data.type == 'var') {
    inputs.find('#'+randIn2).attr('checked', 'checked')
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


window.codeRenderers.VAL = function (el, block) {
  var content = createBlock('icon_terminal', 'VAL', 'Value', true)
  var inputs = createInputs(block.data)
  content.find('.codeblock-inputs').html(inputs)
  el.after(content)
  return {el: content, returns: true}
}

window.codeParsers.VAL = function (el, code) {
  var type = el.find('input[type="radio"]:checked').next().text()
  console.log(type)
  var data
  if (type == 'From previous')
    data = {type: 'prev'}
  if (type == 'Value')
    data = {type: 'raw', value: el.find('.value-input').val()}
  code.push({type: 'VAL', data: data})
}


window.codeRenderers.CONSOLE_OUT = function (el, data) {
  var content = $('<div class="codeblock" data-type="CONSOLE_OUT">'
                  + '<div class="codeblock-header">'
                  + '<img src="/static/imgs/icon_terminal.png" class="codeblock-icon">'
                  + '<span class="codeblock-title">Console Output</span>'
                  + '</div>'
                  + '</div>'
                )
  el.after(content)
  return {el: content, returns: false}
}
window.codeParsers.CONSOLE_OUT = function (el, code) {
  code.push({type: 'CONSOLE_OUT', data: {type: 'prev'}})
}


window.codeRenderers.CONSOLE_IN = function (el, data) {
  var content = $('<div class="codeblock" data-type="CONSOLE_IN">'
                  + '<div class="codeblock-header">'
                  + '<img src="/static/imgs/icon_terminal.png" class="codeblock-icon">'
                  + '<span class="codeblock-title">Console Input</span>'
                  + '</div>'
                  + '</div>'
                )
  el.after(content)
  return {el: content, returns: true}
}
window.codeParsers.CONSOLE_IN = function (el, code) {
  code.push({type: 'CONSOLE_IN'})
}


window.codeRenderers.VAR_GET = function (el, data) {
  var markup = $('<div class="codeblock" data-type="VAR_GET"><img src="/static/imgs/var.png" class="codeblock-icon"><span class="codeblock-title">Variable</span></div>')
  el.after(markup)
  return {el: markup, returns: true}
}

window.codeRenderers.VAR_SET = function (el, data) {
  var markup = $('<div class="codeblock" data-type="VAR_SET"><img src="/static/imgs/var.png" class="codeblock-icon"><span class="codeblock-title">Variable</span></div>')
  el.after(markup)
  return {el: markup, returns: true}
}
