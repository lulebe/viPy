from sanic import response
from ..helpers import programs, compiler
import os

programPath = os.path.join(os.path.dirname(__file__),'../../programs')

async def saveProgram(request, name):
    realname = name.replace('%20', ' ')
    print(request.body)
    programs.saveProgram(realname, request.body)
    return response.text('')

async def runProgram(request, name):
    realname = name.replace('%20', ' ')
    inPath = os.path.join(programPath, realname+'.json')
    outPath = os.path.join(programPath, 'compiled', realname+'.py')
    compiler.compileFile(inPath, outPath)
    programs.runProgram(realname)
    return response.text('')


def init(app):
    app.add_route(saveProgram, '/api/saveprogram/<name>', methods=['POST'])
    app.add_route(runProgram, '/api/runprogram/<name>')
