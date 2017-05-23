import asyncio

sio = None
inputListener = None
terminateListener = None

def clientMessage(line):
    if inputListener:
        inputListener(line)

def terminateScript():
    if terminateListener:
        terminateListener()

def sendStdout(line):
    asyncio.ensure_future(__asyncStdout(line))

async def __asyncStdout(line):
    await sio.emit('stdout', line)
