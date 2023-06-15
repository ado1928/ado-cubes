import { camera, sun } from './main.js';
import { createMessage, coloride, escapeHTML, coordsValid } from './utils.js';

export function commandHandler(data) {
	let args = inputChat.value.slice(1).split(' ');
	let command = escapeHTML(args[0]); args.shift();
	if (!commands[command]) return createMessage(`command <b>${command}</b> does not exist`);
	
	for (let i = 0; i < args.length; i++) {
		args[i] = escapeHTML(args[i]);
		if (!isNaN(args[i])) args[i] = Number(args[i]);
	}
	if (args.length <= 1) args = args[0];

	commands[command].run(args);
}

const commands = {
	help: {
		help: [
			"shows what a command does",
			"/help [command]",
			"you can leave [command] blank to list all commands"
		],
		run: command => {
			createMessage(`----------`);
			if (command) return commands[command].help.reverse().forEach(text => {
				createMessage((!text) ? '<br>' : coloride(text), true)
			});

			Object.keys(commands).reverse().forEach(command => {
				createMessage(`<b>${command}</b> - ${commands[command].help[0]}`)
			});
		}
	},
	formatting: {
		help: [
			"use colors in your messages",
			"very :#32:c:#20:o:#25:l:#39:o:#35:r:#49:m:#1:a:#2:t:#29:i:#17:c",
			"",
			"syntax is :<span>#</span>1: with 1 being the color number",
			"use :<span>#</span>: with no color to reset",
			"",
			"colors are taken from the world palette. hover on a palette color to show its color number",
			"you can also use colors in your nicknames, but colors are taken from an already-defined palette",
		],
		run: () => commands.help.run('formatting')
	},
	tp: {
		help: [
			"teleportation",
			"/tp [x] [y] [z]"
		],
		run: coords => {
			if (!coordsValid(coords)) return createMessage("Invalid coords!");
			camera.position.set(coords[0], coords[1], coords[2]);
			createMessage(`Teleported to ${coords}`);
		}
	},
	look: {
		help: [
			"look at that pose",
			"/look [x] [y] [z]"
		],
		run: coords => {
			if (!coordsValid(coords)) return createMessage("Invalid coords!");
			camera.lookAt(coords[0], coords[1], coords[2]);
			createMessage(`Looked to ${coords}`);
		}
	},
	sun: {
		help: [
			"position the sun or whatever",
			"/sun [x] [y] [z]"
		],
		run: coords => {
			if (coords == 'reset') { sun.position.set(20, 90, 50); return createMessage('Sun position has been reset') }
			if (!coordsValid(coords)) return createMessage("Invalid coords!");
			sun.position.set(coords[0], coords[1], coords[2]);
			sun.shadow.needsUpdate = true;
			createMessage(`Repositioned sun`)
		}
	},
	clear: {
		help: [
			"clear messages",
			"/clear"
		],
		run: () => messages.innerHTML = ''
	},
	egg: {
		help: [
			"stack eggs",
			"/egg [amount]"
		],
		run: number => {
			if (isNaN(number)) return createMessage('Invalid number!');
			let egg = '🥚';
			for (let i = 1; i < number; i++) egg += '🥚';
			createMessage(egg);
		}
	},
	cmsg: {
		help: [
			"create a message to yourself",
			"/cmsg <text>"
		],
		run: text => createMessage(coloride(text))
	}
}

window.commands = commands