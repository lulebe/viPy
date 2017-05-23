import os
import asyncio
from app.sockets import sockets


programPath = os.path.join(os.path.dirname(__file__),'../../programs')

def listAll():
    fileList = [f for f in os.listdir(programPath) if os.path.isfile(os.path.join(programPath, f))]
    fileList = list(map(lambda f: f.replace('.json', ''), fileList))
    fileList.sort()
    return fileList

def getProgramJson(name):
    with open(os.path.join(programPath, name+'.json'), 'r') as myfile:
        return myfile.read()

def saveProgram(name, data):
    with open(os.path.join(programPath, name+'.json'), 'wb') as myfile:
        myfile.write(data)

def createProgram(name):
    saveProgram(name, '{"vars": [], "code": []}'.encode())

def deleteProgram(name):
    os.remove(os.path.join(programPath, name+'.json'))

def renameProgram(oldname, newname):
    os.rename(os.path.abspath(os.path.join(programPath, oldname+'.json')), os.path.abspath(os.path.join(programPath, newname+'.json')))


def runProgram(name):
    asyncio.ensure_future(_stream_subprocess(['python3', os.path.join(programPath, 'compiled', name+'.py')]))

async def _read_stream(stream, cb):
    chars = ''
    while True:
        char = await stream.read(1)
        if char:
            chars +=char.decode('utf-8')
            if chars.endswith('\n') or chars == '__RECEIVING_INPUT__':
                cb(chars)
                chars = ''
        else:
            break

def writeToProcess(line, process):
    process.stdin.write(str.encode(line+'\n'))

async def _stream_subprocess(cmd):
    process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, stdin=asyncio.subprocess.PIPE)
    sockets.terminateListener = lambda: process.terminate()
    sockets.inputListener = lambda line: writeToProcess(line, process)
    await asyncio.wait([
        _read_stream(process.stdout, sockets.sendStdout),
        _read_stream(process.stderr, sockets.sendStderr)
    ])
    if process.returncode != None:
        process = None
        sockets.sendStdout('Program has finished.')
        sockets.inputListener = None
    else:
        await process.wait()
        process = None
        sockets.sendStdout('Program has finished.')
        sockets.inputListener = None