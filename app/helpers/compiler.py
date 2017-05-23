import json

codeblocks = {}

def compileFile(path, outFile=False):
    with open(path) as data_file:
        data = json.load(data_file)
    if outFile:
        with open(outFile, 'w') as outputfile:
            outputfile.write(compileJson(data))
    else:
        return compileJson(data)

#1. loop over code
#2. per block call code constructor function based on type
def compileJson(data):
    return 'prevVal=""\n'+''.join(compileCodelist(data['code']))

def compileCodelist(code, indent=0):
    if len(code) == 0:
        return '  '*indent+'pass\n'
    else:
        codelist = ''
        for codeblock in code:
            codelist += codeblocks[codeblock['type']](codeblock, indent)
        return list(map(lambda l: '  '*indent+l+'\n', codelist.split('\n')))

def formatValue(val, format='unknown'):
    if format == 'string':
        return '"'+str(val).replace('"', '\\"')+'"'
    if format == 'number':
        return str(float(val))
    if format == 'unknown':
        try:
            return str(float(val))
        except Exception as e:
            return '"'+str(val).replace('"', '\\"')+'"'

def compileValue(data, format='unknown'):
    if data['type'] == 'raw':
        return formatValue(data['value'], format)
    if data['type'] == 'var':
        return data['name']
    if data['type'] == 'prev':
        return 'prevVal'
    raise ValueError('Value is neither raw nor var.')

def compile_val(codeblock, indent):
    return 'prevVal = ' + compileValue(codeblock['data']) + '\n'

codeblocks['VAL'] = compile_val


def compile_varSet(codeblock, indent):
    val = compileValue(codeblock['data'])
    return '%s = %s\nprevVal = %s\n' % (codeblock['name'], val, val)

codeblocks['VAR_SET'] = compile_varSet


def compile_varGet(codeblock, indent):
    return 'prevVal = %s\n' % codeblock['name']

codeblocks['VAR_GET'] = compile_varGet


def compile_consoleOut(codeblock, indent):
    return 'print(%s)\n' % compileValue(codeblock['data'], format='string')

codeblocks['CONSOLE_OUT'] = compile_consoleOut

def compile_consoleIn(codeblock, indent):
    return 'prevVal = input("__RECEIVING_INPUT__")\n'

codeblocks['CONSOLE_IN'] = compile_consoleIn


def compile_ifElse(codeblock, indent):
    return compileCodeList(codeblock['yes'], indent+1)

codeblocks['IF_ELSE'] = compile_ifElse
