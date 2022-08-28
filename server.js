const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const textencoder = new TextEncoder();
const textdecoder = new TextDecoder();
const moment = require('moment');

const { Webhook } = require('discord-webhook-node');
const dsbridgeconfig = { "webhookToken": "", "botToken": "", "channelId": "" }
//const dsbridgeconfig = require('./dsbridgeconfig');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES + Intents.FLAGS.GUILDS ] });
const hook = new Webhook(dsbridgeconfig.webhookToken);

const port = 1928;
var world;
var lastsaved = Date.now();

fs.readFile('./world.caw', 'utf8' , (err, data) => {
	if (err) throw err;
	world = textencoder.encode(data);
	// world = new Uint8Array(262144).fill(0); // Fills the world with nothing
})

// very unnecessary little indicator
function osIcon() {
	switch (process.platform) {
		case 'linux':	return('🐧'); break
		case 'win32':	return('🪟'); break
		case 'sunos':	return('☀️'); break
		case 'darwin':	return('🍎'); break
		case 'freebsd':	return('🔴'); break
		case 'openbsd':	return('🟡'); break
		case 'android':	return('🤖'); break
		case 'aix': 	return('\x1b[38;5;39mIBM\x1b[0m'); break
	}
}

function dateLog(msg) { console.log(`  ${moment(Date.now()).format("L HH:mm:ss")}\x1b[90m │ \x1b[0m${msg} \x1b[0m`) };
console.clear(); console.log();

function serverMessage(msg) {
	io.emit('serverMessage', { "message": msg });
	dateLog(msg);
	if (dsbridgeconfig.webhookToken) {
		hook.setUsername("Server");
		hook.setAvatar("https://cdn.discordapp.com/attachments/968866349633896488/968866464150978620/favicon.png");
		hook.send(msg.replace(/\x1b\[[0-9;]*m/g,""))
	}
}

io.on('connection', socket => {
	if (!socket.id.name) socket.emit('connected', world);

	socket.on('place', data => {
		pos = data.pos;
		if (posValid(pos)) {
			world[pos[0]*4096+pos[1]*64+pos[2]] = data.color + 1;
			io.emit('place', data);
			if (Date.now() - lastsaved > 60000) saveWorld()
		}
	});

	socket.on('break', data => {
		pos = data.pos;
		if (posValid(pos)) {
			world[pos[0]*4096+pos[1]*64+pos[2]] = 0;
			io.emit('break', data)
		}
	});

	socket.on('message', data => {
		io.emit('message', data);
		dateLog("\x1b[1m" + data.sender + "\x1b[0m: " + data.msg);
		if (dsbridgeconfig.webhookToken) {
			hook.setUsername(data.sender);
			hook.setAvatar();
			hook.send(data.msg.replace(/\x1b\[[0-9;]*m/g,""))
		}
	});

	socket.on('playerJoin', data => {
		socket.id = data;
		serverMessage(`${socket.id.name} joined the server`);
	});

	socket.on('disconnect', reason => {
		if (!socket.id.name) return; // Botch fix for 2 sockets per player
		serverMessage(`${socket.id.name} left the server`);
		if (io.engine.clientsCount == 0) { lastsaved = Date.now(); saveWorld() }
	});
});

function posValid(pos) {
	let valid = true;
	for (const coord of pos) if (0 > coord || coord > 63) valid = false;
	return(valid)
}

function saveWorld() {
	fs.writeFile('./world.caw', textdecoder.decode(world), err => { if (err) throw err });
	dateLog("Saved world.");
	lastsaved = Date.now()
}

// Discord bot bridging
client.on('messageCreate', async message => {
	if (!message.user
	|| message.webhookID
	|| message.channel !== `<#${dsbridgeconfig.channelId}>`) return;
	dateLog(message.msg);
	io.emit('message', { "sender": `[${message.author.username}]`, "msg": message.content });
});
client.once('ready', () => { dateLog("🎮 \x1b[38;5;75mBridge is ready!") });
if (dsbridgeconfig.botToken) client.login(dsbridgeconfig.botToken);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
	dateLog(`Someone's asking to GET ${req.url}`);
	if (req.url == '/') res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, () => dateLog(`${osIcon()} Listening to \x1b[38;5;87mhttp://localhost:${port}/`));
