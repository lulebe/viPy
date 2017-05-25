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
    programs.runProgram(realname)
    return response.text('')

async def getProgramCode(request, name):
    realname = name.replace('%20', ' ')
    programs.compileProgram(realname)
    return response.text(programs.getCode(realname))


def init(app):
    app.add_route(saveProgram, '/api/saveprogram/<name>', methods=['POST'])
    app.add_route(runProgram, '/api/runprogram/<name>')
    app.add_route(getProgramCode, '/api/programcode/<name>')
