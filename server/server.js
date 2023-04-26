const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const DOMPurify = require('isomorphic-dompurify');
const marked = require('marked');
const textencoder = new TextEncoder();
const textdecoder = new TextDecoder();
const toml = require('toml');
const Ratelimit = require('./ratelimit.js');

let config = toml.parse(fs.readFileSync('./server/config.toml', 'utf-8'));
const { Client, Intents } = require('discord.js');
const { Webhook } = require('discord-webhook-node');
const dsbridge = new Client({ intents: [Intents.FLAGS.GUILD_MESSAGES + Intents.FLAGS.GUILDS ] });
const dshook = new Webhook(config.dsbridge.webhookUrl);

console.clear();
console.log();

function log(msg) {
	console.log(`  ${moment().format("HH:mm:ss")}\x1b[90m │ \x1b[0m${msg} \x1b[0m`)
};

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
	if (escape) data = escapeHTML(data);
	return DOMPurify.sanitize(data, {
		ALLOWED_TAGS: ['span', 'a', 'b', 'i', 'strong', 'em'],
		FORBID_ATTR: ['style', 'class']
	})
}

let renderer = {
	strong(text) { return `<b>${text}</b>` },
	em(text) { return `<i>${text}</i>` },
	link(href, title, text) { return `<a href="${href}" rel="noopener noreferrer">${text}</a>` }
};

marked.use({renderer});

const osIcon = {
	linux: '🐧',
	win32: '🟦',
	sunos: '☀️',
	darwin: '🍎',
	freebsd: '🔴',
	openbsd: '🟡',
	android: '🤖',
	aix: '🟢'
}



var lastsaved = Date.now();

let worlds = {};
let worldslist = [];

fs.readdir("server/worlds", (err, crows) => {
	if (err) throw err;
	crows.forEach((crow, i) => {
		crow = crow.substr(0, crow.length - 4);
		worldslist.push(crow)
		fs.readFile(`./server/worlds/${crow}.caw`, 'utf8', (err, data) => {
			if (err) throw err;
			worlds[crow] = textencoder.encode(data);
			// worlds[i] = new Uint8Array(262144).fill(0) // Fills the world with nothing. Debugging purposes.
		})
	});
	worldslist.sort();
	log(`\x1b[90mloaded ${worldslist}`);
})

function loadWorld(socket) {
	socket.join(socket.player.world);
	io.to(socket.id).emit('connected', {
		world: worlds[socket.player.world],
		palette: config.defaults.world.palette
	})
}

function saveWorld(i) {
	fs.writeFile(`./server/worlds/${i}.caw`, textdecoder.decode(worlds[i]), err => { if (err) throw err });
	lastsaved = Date.now();
	log(`🌍 Saved world ${bold(i)}`);
}

function socketValid(socket) { // this looks wonky :P
	if (!socket.player || !socket.player.name || !socket.player.world
		|| !worldslist.includes(socket.player.world)
		|| !socket.player.name.length > 30
	) return kickSocket(socket);

	return true;
}

function kickSocket(socket, reason) {
	socket.emit('ohno', reason);
	socket.disconnect();
	return false
}

function cubeValid(pos, color) {
	if (pos) for (const coord of pos) if (0 > coord || coord > 63) return false;
	if (color) if ((color + 1) > config.defaults.world.palette.length) return false;
	return true
}

function serverMessage(msg) {
	io.emit('serverMessage', { "content": msg });
	log(msg);
	if (config.dsbridge.enabled) {
		dshook.setUsername("Server");
		dshook.send(msg.replace(/\x1b\[[0-9;]*m/g, ''));
	}
}

function playerlist(socket) {
	let players = [];
	io.sockets.adapter.rooms.get(socket.player.world).forEach(id => {
		players.push(io.sockets.sockets.get(id).player)
	});
	io.to(socket.player.world).emit('playerlist', players);
}

function bold(text) { return `\x1b[1m${text}\x1b[0m` }

io.on('connection', socket => {
	let ratelimit = new Ratelimit([socket, config.ratelimit]);

	function disconnect() {
		if (!socketValid(socket)) return;
		io.to(socket.player.world).emit('leaveMessage', { 'player': escapeHTML(socket.player.name) });
		log(`👋 ${bold(socket.player.name)} left world ${bold(socket.player.world)}`);

		if (io.sockets.adapter.rooms.has(socket.player.world)) {
			playerlist(socket);
		} else {
			saveWorld(socket.player.world);
			lastsaved = Date.now();
		}

		socket.player = undefined;
	}

	io.emit('worldslist', worldslist);

	socket.on('joinWorld', data => {
		socket.player = data;
		socket.player.name = escapeHTML(data.name);
		socket.player.id = socket.id;

		if (!socketValid(socket)) return;

		loadWorld(socket);
		playerlist(socket);
		io.to(socket.player.world).emit('joinMessage', { 'player': escapeHTML(socket.player.name) });
		log(`🤝 ${bold(socket.player.name)} joined world ${bold(socket.player.world)}`);
	});

	socket.on('leaveWorld', () => {
		if (!socketValid(socket)) return;
		socket.leave(socket.player.world);
		socket.emit('leaveWorld');
		disconnect(socket);
	});

	socket.on('disconnect', () => disconnect());



	socket.on('place', data => {
		pos = data.pos;
		color = data.color;
		if (!socketValid(socket) || ratelimit.cubes || !cubeValid(pos, color)) return;
		if (worlds[socket.player.world][pos[0] * 4096 + pos[1] * 64 + pos[2]] !== 0) return;
		worlds[socket.player.world][pos[0] * 4096 + pos[1] * 64 + pos[2]] = color + 1;
		io.to(socket.player.world).emit('place', data);
		if (Date.now() - lastsaved > 30000) saveWorld(socket.player.world);
	});

	socket.on('break', data => {
		pos = data.pos;
		if (!socketValid(socket) || ratelimit.cubes || !cubeValid(pos)) return;
		worlds[socket.player.world][pos[0] * 4096 + pos[1] * 64 + pos[2]] = 0;
		io.to(socket.player.world).emit('break', data);
	});

	socket.on('message', content => {
		if (!socketValid(socket) || ratelimit.chat || content.length > 1600) return;
		io.to(socket.player.world).emit('message', {
			'sender': {
				'name': socket.player.name,
				'id': socket.id,
			},
			'content': sanitize(marked.parseInline(content)),
			'timestamp': Date.now()
		});
		log(`🌍 ${bold(socket.player.world)} > ${bold(socket.player.name)}: ${sanitize(content)}`);

		if (config.dsbridge.enabled) {
			dshook.setUsername(`🌍 ${socket.player.world} ~ ${socket.player.name}`);
			dshook.send(content.replace(/\x1b\[[0-9;]*m/g,""))
		}
	});
});

// Discord bot bridging. likely broken
if (config.dsbridge.enabled) {
	dsbridge.on('messageCreate', async message => {
		if (message.author.bot || message.channelId !== config.dsbridge.channelId) return;
		io.emit('message', { "sender": `[${message.author.username}]`, "msg": message.content });
		log(`🎮 ${bold('bridge')} > ${bold(message.author.username)}: ${message.content}`);
		message.attachments.forEach(attachment => {
			log(`^^ ${attachment.name} ~ ${attachment.url}`);
		});
	});
	dsbridge.once('ready', () => {
		dshook.send("hi");
		log("🎮 \x1b[38;5;75mBridge is ready!");
	});
	dsbridge.login(config.dsbridge.botToken);
}

app.use(express.static(path.join(__dirname, '../client/public')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
app.get('/', (req, res) => { res.sendFile(__dirname + '../client/public/index.html')});

http.listen(config.port, () => log(`${osIcon[process.platform]} Listening to \x1b[38;5;87mhttp://localhost:${config.port}/\x1b[0!`));
