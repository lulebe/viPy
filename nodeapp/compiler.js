const fs = require('fs')

module.exports = {
  compileFile,
  compileJson
}


const codeblocks = {}


function strRep (str, times) {
   return (new Array(times + 1)).join(str)
}

function compileFile (path, outFile, cb) {
  fs.readFile(path, (err, data) => {
    if (err) {
      cb(err)
      return
    }
    if (outFile) {
      fs.writeFile(outFile, compileJson(JSON.parse(data)), err => {
        if (err)
          cb(err)
        else
          cb(null)
      })
    }
    else
      cb(null, compileJson(JSON.parse(data)))
  })
}

//1. loop over code
//2. per block call code constructor function based on type
function compileJson(data) {
  var code = '#imports\nfrom time import sleep\nimport sys\n\n#variable inits\nprevVal=""\n'
  data.vars.forEach(v => {
    code += '___'+v+'=""\n'
  })
  code += compileCodelist(data.code)
  return code
}

function compileCodelist(code, indent) {
  if (!indent)
    indent = 0
  if (code.length == 0)
    return strRep('  ', indent)+'pass\n'
  else {
    var codelist = ''
    code.forEach(codeblock => {
      codelist += codeblocks[codeblock.type](codeblock, indent)
    })
    return codelist.split('\n').map(l => strRep('  ', indent)+l+'\n').join('')
  }
}

function formatValue(val, format) {
  if (format == 'string')
    return '"'+(''+val).replace(/"/g, '\\"')+'"'
  if (format == 'number')
    return parseFloat(val)
  try {
    return parseFloat(val)
  } catch (e) {
    return '"'+(''+val).replace(/"/g, '\\"')+'"'
  }
}

function formatVar(name, format) {
  if (format == 'string')
    return 'str('+name+')'
  if (format == 'number')
    return 'float('+name+')'
  return name
}

function compileValue(data, format) {
  if (data.type == 'raw')
    return formatValue(data.value, format)
  if (data.type == 'var')
    return formatVar('___'+data.name, format)
  if (data.type == 'prev')
    return formatVar('prevVal', format)
  throw Error('Value is neither raw nor var.')
}


function compile_varSet(codeblock, indent) {
  var val = compileValue(codeblock.data)
  return '#set variable\n___' + codeblock.name + ' = ' + val + '\nprevVal = ' + val + '\n'
}

codeblocks['VAR_SET'] = compile_varSet


function compile_consoleOut(codeblock, indent) {
  return '#console output\nprint(' + compileValue(codeblock.data, 'string') + ')\nsys.stdout.flush()\n'
}

codeblocks['CONSOLE_OUT'] = compile_consoleOut

function compile_consoleIn(codeblock, indent) {
  return '#console input\nprevVal = input("__RECEIVING_INPUT__")\n'
}

codeblocks['CONSOLE_IN'] = compile_consoleIn


function compile_ifElse(codeblock, indent) {
  return compileCodeList(codeblock.yes, indent+1)
}

codeblocks['IF_ELSE'] = compile_ifElse


function compile_wait(codeblock, indent) {
  return '#wait\nsleep('+compileValue(codeblock.data, 'number')+')\n'
}

codeblocks['WAIT'] = compile_wait


function compile_code(codeblock, indent) {
  return '#custom code\n'+codeblock.code +'\n'
}

codeblocks['CODE'] = compile_code
