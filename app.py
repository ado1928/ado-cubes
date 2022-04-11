from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

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
def handle_message(data):
    #print(data)
    data["x"] = (data["x"] + 0.5) // 5 * 5
    data["y"] = (data["y"] + 0.5) // 5 * 5
    data["z"] = (data["z"] + 0.5) // 5 * 5
    cubes.append(data)
    #print(data)
    emit('place', data, broadcast = True)


@socketio.on('connect')
def test_connect(auth):
    emit("connected", cubes)

if __name__ == '__main__':
    socketio.run(app)