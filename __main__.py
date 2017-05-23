from sanic import Sanic
from app.routes import htmlrouter, apirouter
from app.sockets import sockets
import socketio

app = Sanic(__name__)

app.static('/static', './static')
app.static('/api/program', './programs')

#html routes
htmlrouter.init(app)
apirouter.init(app)

#sockets
sio = socketio.AsyncServer()
sio.attach(app)
sockets.sio = sio
@sio.on('stdin')
def socket_message(sid, data):
    sockets.clientMessage(data)


app.run(host="0.0.0.0", port=8000, debug=True)
