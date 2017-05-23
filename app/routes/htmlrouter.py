from sanic import response
from sanic_jinja2 import SanicJinja2
from jinja2 import FileSystemLoader
from ..helpers import programs
import os

jinja = SanicJinja2()

async def allPrograms(request):
    progList = programs.listAll()
    return jinja.render('index.html', request,
    programs=progList, noPrograms=len(progList)==0)

async def newProgramPage(request):
    return jinja.render('newProgram.html', request)

async def createProgram(request):
    programs.createProgram(request.form.get('name'))
    return response.redirect('/program/'+request.form.get('name'))

async def showProgram(request, name):
    realname = name.replace('%20', ' ')
    progJson = programs.getProgramJson(realname).replace('\n', '')
    return jinja.render('program.html', request,
    programJson=progJson, name=realname)

async def deleteProgram(request, name):
    realname = name.replace('%20', ' ')
    programs.deleteProgram(realname)
    return response.redirect('/')

async def renameProgram(request):
    programs.renameProgram(request.form.get('program'), request.form.get('name'))
    return response.redirect('/')

async def tutorial(request):
    return jinja.render('tutorial.html', request)

def init(app):
    jinja.init_app(app, loader=FileSystemLoader(os.path.join(os.path.dirname(__file__),'../../templates')))
    app.add_route(allPrograms, '/')
    app.add_route(newProgramPage, '/new')
    app.add_route(createProgram, '/new', methods=['POST'])
    app.add_route(showProgram, '/program/<name>')
    app.add_route(deleteProgram, '/deleteprogram/<name>')
    app.add_route(renameProgram, '/renameprogram', methods=['POST'])
    app.add_route(tutorial, '/tut')
