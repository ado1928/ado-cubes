const express = require('express');
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const port = 1180;

var world = require('./world.json');
var lastsaved = Date.now();

console.log(world);

io.on('connection', (socket) => {
	socket.emit('connected', world);

	socket.on('place', (data) => {
		pos = data.pos;
		// Validate placement coordinates
		for (const coord of pos){if (0 > coord > 64) return;}
		// Set the block serverside
		world[pos[0]][pos[1]][pos[2]] = 1;
		io.emit('place', data);
		console.log("i sense someone placing cube")
		// If 10 minutes passed since last place event, save the world
		if (Date.now() - lastsaved > 6000){
			console.log('Autosaving...');
			lastsaved = Date.now();
			fs.writeFile('./world.json', JSON.stringify(world), err => {if(err) throw err;});
		}
	});

  // Identical to placement
	socket.on('break', (data) => {
		pos = data.pos;
		for (const coord of pos){if (0 > coord > 64) return;}
		world[pos[0]][pos[1]][pos[2]] = 0;
		io.emit('break', data);
	});

	socket.on('message', (data) => {
		io.emit('message', data);
	});
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Serve index.html (i hope)
app.get('/', (req, res) => {
	console.log("Someone's asking to GET " + req.url);
	if (req.url == '/') res.sendFile(__dirname + '/' + 'public/index.html');
});

http.listen(port, () => {
	console.log(`Socket.IO server running at http://localhost:${port}/`);
});
