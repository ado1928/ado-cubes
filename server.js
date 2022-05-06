const express = require('express');
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const textencoder = new TextEncoder();
const textdecoder = new TextDecoder();


const { Webhook } = require('discord-webhook-node');
const dsbridgeconfig = require('./dsbridgeconfig');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES + Intents.FLAGS.GUILDS ] });

const port = 1928;

var lastsaved = Date.now();

const hook = new Webhook(dsbridgeconfig.webhooktoken);

var world;
fs.readFile('./world.caw', 'utf8' , (err, data) => {
	if (err) throw err;
	world = textencoder.encode(data);
})
// world = new Uint8Array(262144).fill(0);

io.on('connection', (socket) => {
	socket.emit('connected', world);

	socket.on('place', (data) => {
		pos = data.pos;
		if (posvalid(pos)) {
			world[pos[0]*4096+pos[1]*64+pos[2]] = data.color + 1;
			io.emit('place', data);
			if (Date.now() - lastsaved > 60000) worldsave()
		}
	});

	socket.on('break', (data) => {
		pos = data.pos;
		if (posvalid(pos)) {
			world[pos[0]*4096+pos[1]*64+pos[2]] = 0;
			io.emit('break', data);
		}
	});

	socket.on('message', (data) => {
		io.emit('message', data);
		if (dsbridgeconfig.webhooktoken) {
			hook.setUsername(data.sender);
			hook.setAvatar();
			hook.send(data.message)
		}
	});

	socket.on('serverMessage', (data) => {
		io.emit('serverMessage', data);
		if (dsbridgeconfig.webhooktoken) {
			hook.setUsername("Server");
			hook.setAvatar("https://cdn.discordapp.com/attachments/968866349633896488/968866464150978620/favicon.png");
			hook.send(data.message)
		}
	});

	socket.on('disconnect', (reason) => {
		if (io.engine.clientsCount == 0) {
			lastsaved = Date.now();
			worldsave()
		}
	});
});


function posvalid(pos) {
	let valid = true;
	for (const coord of pos) { if (0 > coord || coord > 63) valid=false; }
	return(valid)
}

function worldsave() {
	console.log("Saved world.");
	lastsaved = Date.now();
	fs.writeFile('./world.caw', textdecoder.decode(world), err => {if(err) throw err;});
}

// Discord bot bridging
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.webhookID) return;
	if (message.channel != dsbridgeconfig.channelid) return;
	io.emit('message', { "sender": "[" + message.author.username + "]", "message": message.content });
});

client.once('ready', () => { console.log("Bridge is ready!") });

if (dsbridgeconfig.bottoken) client.login(dsbridgeconfig.bottoken);


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Serve index.html (i hope)
app.get('/', (req, res) => {
	console.log("Someone's asking to GET " + req.url);
	if (req.url == '/') res.sendFile(__dirname + '/' + 'public/index.html');
});

http.listen(port, () => { console.log(`listening to http://localhost:${port}/`) });
