from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit
import os
import numpy as np

app = Flask(__name__)
socketio = SocketIO(app)

size = (64, 64, 64)
world = np.zeros(size, dtype=np.int8)
cubes = []

class Cube():
    def __init__(self, x, y):
        self.x = x
        self.y = y
    

@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")

@app.route('/static/<path:path>')
def send_file(path):
    return send_from_directory("/static", path)

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
    emit("connected", world.tolist())

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get('PORT', 17995)))