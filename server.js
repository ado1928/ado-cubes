const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const textencoder = new TextEncoder();
const textdecoder = new TextDecoder();
const moment = require('moment');
const DOMPurify = require('isomorphic-dompurify');
const marked = require('marked');

const toml = require('toml');
let config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

const { Client, Intents } = require('discord.js');
const { Webhook } = require('discord-webhook-node');
const client = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES + Intents.FLAGS.GUILDS ] });
const hook = new Webhook(config.dsbridge.webhookToken);

console.clear();
console.log();

function log(msg) {
	console.log(`  ${moment().format("HH:mm:ss")}\x1b[90m │ \x1b[0m${msg} \x1b[0m`)
};

marked.use({
	strong(text) { return `<b>${text}</b>` },
	em(text) { return `<i>${text}</i>` }
})

function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/`/g, '&#96;')
};

function sanitize(data, escape) {
	data = (escape) ? escapeHTML(data) : data
	return DOMPurify.sanitize(data, {
		ALLOWED_TAGS: ['a', 'b', 'i', 'strong', 'em']
	})
}

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



var lastsaved = Date.now();

let worlds = {};
let worldslist = [];
fs.readdir('worlds', (err, crows) => { if (err) throw err;
	crows.forEach((crow, i) => {
		crow = crow.substr(0, crow.length - 4);
		worldslist.push(crow);
		fs.readFile(`./worlds/${crow}.caw`, 'utf8', (err, data) => { if (err) throw err;
			worlds[crow] = textencoder.encode(data);
			// worlds[i] = new Uint8Array(262144).fill(0) // Fills the world with nothing. Debugging purposes.
		})
	})
	worldslist.sort()
	log(`\x1b[90mloaded ${worldslist}`)
})

function posValid(pos) {
	for (const coord of pos) if (0 > coord || coord > 63) return false;
	return true
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

function loadWorld(socket) {
	socket.join(socket.player.world);
	fs.readFile(`./worlds/${socket.player.world}.caw`, 'utf8', (err, data) => { if (err) throw err;
		world = textencoder.encode(data);
		io.to(socket.id).emit('connected', world);
	})
}

function saveWorld(i) {
	fs.writeFile(`./worlds/${i}.caw`, textdecoder.decode(worlds[i]), err => { if (err) throw err });
	lastsaved = Date.now();
	log(`🌍 Saved world ${i}`)
}

io.on('connection', socket => {
	io.emit('worldslist', worldslist)

	socket.on('place', data => {
		pos = data.pos;
		if (posValid(pos)) {
			if (worlds[socket.player.world][pos[0] * 4096 + pos[1] * 64 + pos[2]] !== 0) return;
			worlds[socket.player.world][pos[0] * 4096 + pos[1] * 64 + pos[2]] = data.color + 1;
			io.to(socket.player.world).emit('place', data);
			if (Date.now() - lastsaved > 30000) saveWorld()
		}
	});

	socket.on('break', data => {
		pos = data.pos;
		if (posValid(pos)) {
			worlds[socket.player.world][pos[0] * 4096 + pos[1] * 64 + pos[2]] = 0;
			io.to(socket.player.world).emit('break', data)
		}
	});

	socket.on('message', data => {
		io.to(socket.player.world).emit('message', {
			'sender': {
				'name': escapeHTML(data.sender),
				'id': socket.id,
			},
			'content': sanitize(marked.parseInline(data.content)),
			'timestamp': Date.now()
		});
		log(`\x1b[1m${data.sender}\x1b[0m: ${sanitize(data.content)}`);

		if (config.dsbridge.enabled) {
			hook.setUsername(data.sender);
			hook.setAvatar();
			hook.send(data.content.replace(/\x1b\[[0-9;]*m/g,""))
		}
	});

	socket.on('join', data => {
		socket.player = data;

		loadWorld(socket);
		io.to(socket.player.world).emit('joinMessage', { 'player': escapeHTML(socket.player.name) });
		log(`🤝 ${socket.player.name} joined the server`);
	});

	socket.on('disconnect', reason => {
		if (!socket.player) return; // Botch fix for 2 sockets per player
		io.to(socket.player.world).emit('leaveMessage', { 'player': escapeHTML(socket.player.name) });
		log(`👋 ${socket.player.name} left the server`);

		if (!io.sockets.adapter.rooms.has(socket.player.world)) {
			saveWorld(socket.player.world);
			lastsaved = Date.now();
		}
	});

	/*
	io.of('/').adapter.once('create-room', room => {
		log(`\x1b[37mroom ${room} was created`)
	});

	io.of('/').adapter.once('join-room', (room, id) => {
		log(`\x1b[37msocket ${id} joined room ${room}`)
	})
	*/
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
