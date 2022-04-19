from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit
import os
import numpy as np
import requests

app = Flask(__name__)
socketio = SocketIO(app)

headers = {
    "API-Pub": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO",
    "API-Priv": os.environ.get("PRIV")
}

size = (64, 64, 64)
world = np.zeros(size, dtype=np.int8)
#world.fill(1)
import w
world = w.world

@app.route("/")
def base():
    return send_from_directory('client/public', 'index.html')

@app.route("/<path:path>")
def home(path):
    return send_from_directory('client/public', path)

@socketio.on('message')
def placecube(data):
    emit('message', data, broadcast = True)

@socketio.on('place')
def placecube(data):
    print(data)
    pos = data["pos"]
    if type(pos[0]) is int and type(pos[1]) is int and type(pos[2]) is int:
        if(pos[0] >= 0 and pos[1] >= 0 and pos[2] >= 0 and pos[0] < 64 and pos[1] < 64 and pos[2] < 64):
            if(world[pos[0], pos[1], pos[2]] != 1):
                world[pos[0], pos[1], pos[2]] = 1
                emit('place', data, broadcast = True)
        else:
            print("nah")

@socketio.on('break')
def breakcube(data):
    print(data)
    pos = data["pos"]
    if type(pos[0]) is int and type(pos[1]) is int and type(pos[2]) is int:
        if(pos[0] >= 0 and pos[1] >= 0 and pos[2] >= 0 and pos[0] < 64 and pos[1] < 64 and pos[2] < 64):
            if(world[pos[0], pos[1], pos[2]] != 0):
                world[pos[0], pos[1], pos[2]] = 0
                emit('break', data, broadcast = True)
        else:
            print("nah")

@socketio.on('connect')
def test_connect():
    uuid = request.headers.get("uuid")
    
    req = requests.post("https://eu-dev-c1.iocaptcha.com/api/v1/score", json={"pass_uuid" : uuid, "invalidate": True}, headers=headers)
    print(req.status_code)
    if(req.status_code == 200):
        res = req.json
        print(req.text)
        emit("connected", world.tolist())
        emit("Welcome to wh", data, broadcast = True)
        return True
    else:
        return True

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get('PORT', 80)))