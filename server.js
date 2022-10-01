const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const textencoder = new TextEncoder();
const textdecoder = new TextDecoder();
const moment = require('moment');

const toml = require('toml');
let config = toml.parse(fs.readFileSync('./server.toml', 'utf-8'));

const { Client, Intents } = require('discord.js');
const { Webhook } = require('discord-webhook-node');
const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES + Intents.FLAGS.GUILDS ] });
const hook = new Webhook(config.dsbridge.webhookToken);

function log(msg) { console.log(`  ${moment().format("HH:mm:ss")}\x1b[90m │ \x1b[0m${msg} \x1b[0m`) };
console.clear(); console.log();

var world;
var lastsaved = Date.now();

fs.readFile('./worlds/world.caw', 'utf8', (err, data) => { if (err) throw err;
	world = textencoder.encode(data);
	// world = new Uint8Array(262144).fill(0) // Fills the world with nothing
})

// very unnecessary little indicator
const osIcon = {
	linux: '🐧',
	win32: '🟦',
	sunos: '☀️',
	darwin: '🍎',
	freebsd: '🔴',
	openbsd: '🟡',
	android: '🤖',
	aix: '\x1b[38;5;39mIBM\x1b[0m'
}

function posValid(pos) {
	let valid = true;
	for (const coord of pos) if (0 > coord || coord > 63) valid = false;
	return(valid)
}

function saveWorld() {
	fs.writeFile('./worlds/world.caw', textdecoder.decode(world), err => { if (err) throw err });
	lastsaved = Date.now();
	log("🌍 Saved world.")
}

function serverMessage(msg) {
	io.emit('serverMessage', { "content": msg });
	log(msg);
	if (config.dsbridge.enabled) {
		hook.setUsername("Server");
		hook.setAvatar("https://cdn.discordapp.com/attachments/968866349633896488/968866464150978620/favicon.png");
		hook.send(msg.replace(/\x1b\[[0-9;]*m/g, ''))
	}
}

io.on('connection', socket => {
	socket.emit('connected', world);

	socket.on('place', data => {
		pos = data.pos;
		if (posValid(pos)) {
			if (world[pos[0] * 4096 + pos[1] * 64 + pos[2]] !== 0) return;
			world[pos[0] * 4096 + pos[1] * 64 + pos[2]] = data.color + 1;
			io.emit('place', data);
			if (Date.now() - lastsaved > 60000) saveWorld()
		}
	});

	socket.on('break', data => {
		pos = data.pos;
		if (posValid(pos)) {
			world[pos[0] * 4096 + pos[1] * 64 + pos[2]] = 0;
			io.emit('break', data)
		}
	});

	socket.on('message', data => {
		io.emit('message', data);
		log(`\x1b[1m${data.sender}\x1b[0m: ${data.content}`);
		if (config.dsbridge.enabled) {
			hook.setUsername(data.sender);
			hook.setAvatar();
			hook.send(data.content.replace(/\x1b\[[0-9;]*m/g,""))
		}
	});

	// Join message
	socket.on('join', data => {
		socket.player = data;
		io.emit('joinMessage', { 'player': socket.player.name });
		log(`🤝 ${socket.player.name} joined the server`)
	});

	// Disconnect message & world saving if no players online
	socket.on('disconnect', reason => {
		if (!socket.player) return; // Botch fix for 2 sockets per player
		io.emit('leaveMessage', { 'player': socket.player.name });
		log(`👋 ${socket.player.name} left the server`)
		if (io.engine.clientsCount == 0) { lastsaved = Date.now(); saveWorld() };
	});

	io.of("/").adapter.on("create-room", (room) => {
		log(`room ${room} was created`);
	});

	io.of("/").adapter.on("join-room", (room, id) => {
		log(`socket ${id} has joined room ${room}`);
	});
});

// Discord bot bridging
if (config.dsbridge.enabled) {
	client.on('messageCreate', async message => {
		console.log(message.attachments)
		if (message.author.bot
		|| message.channelId !== config.dsbridge.channelId) return;
		io.emit('message', { "sender": `[${message.author.username}]`, "msg": message.content });
		log(`\x1b[1m[${message.author.username}]\x1b[0m: ${message.content}`);
	});
	client.once('ready', () => { log("🎮 \x1b[38;5;75mBridge is ready!") });
	client.login(config.dsbridge.botToken);
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/game', express.static(path.join(__dirname, 'node_modules')));
app.get('/', (req, res) => {
	log(`Someone's asking to GET ${req.url}`);
	if (req.url == '/') res.sendFile(__dirname + 'public/index.html');
});

http.listen(config.port, () => log(`${osIcon[process.platform]} Listening to \x1b[38;5;87mhttp://localhost:${config.port}/\x1b[0!`));
