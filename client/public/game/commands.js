import { createMessage, camera, sun } from './main.js';
import { escapeHTML, coloride, coordsValid } from './utils.js';

export const commands = {
	cmsg: {
		help: [
			"create a message to yourself",
			"/cmsg <text>"
		],
		args: text => createMessage(coloride(escapeHTML(text)))
	},
	egg: {
		help: [
			"stack eggs",
			"/egg [amount]"
		],
		args: number => {
			if (isNaN(number)) return createMessage('Invalid number!');
			let egg = '🥚';
			for (let i = 1; i < number; i++) egg += '🥚';
			createMessage(egg);
		}
	},
	clear: {
		help: [
			"clear messages",
			"/clear"
		],
		args: () => messages.innerHTML = ''
	},
	look: {
		help: [
			"look at that pose",
			"/look [x] [y] [z]"
		],
		args: coords => {
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
		args: coords => {
			if (coords == 'reset') { sun.position.set(20, 90, 50); return createMessage('Sun position has been reset') }
			if (!coordsValid(coords)) return createMessage("Invalid coords!");
			sun.position.set(coords[0], coords[1], coords[2]);
			sun.shadow.needsUpdate = true;
			createMessage(`Repositioned sun`)
		}
	},
	tp: {
		help: [
			"teleportation",
			"/tp [x] [y] [z]"
		],
		args: coords => {
			if (!coordsValid(coords)) return createMessage("Invalid coords!");
			camera.position.set(coords[0], coords[1], coords[2]);
			createMessage(`Teleported to ${coords}`);
		}
	},
	formatting: {
		help: [
			"use colors in your messages. :#30:c:#20:o:#25:l:#39:o:#35:r:#49:m:#1:a:#2:t:#29:i:#17:c",
			"syntax is :<span>#</span>1: with 1 being the color number",
			"use :<span>#</span>: with no color to reset",
			"colors are takens from the palette. hover on a palette color to show its color number"
		],
		args: () => commands.help.args('formatting')
	},
	help: {
		help: [
			"shows what a command does",
			"/help [command]",
			"you can leave [command] blank to list all commands"
		],
		args: command => {
			createMessage(`----------`);
			if (!command) {
				return Object.keys(commands).forEach(command => {
					createMessage(`<b>${command}</b> - ${commands[command].help[0]}`)
				})
			}
			commands[command].help.forEach(text => { createMessage(text) });
		}
	}
}

/*export var flook;

export function executeCommand() {
	let args = escapeHTML(inputChat.value).slice(1).split(" ");
	let command = args[0].toLowerCase(); args.shift();
	inputChat.value = '';

	for (let i = 0; i < args.length; i++) if (!isNaN(args[i])) args[i] = parseInt(args[i]);

	try { switch (command) {
		case 'egg':
			if (isNaN(args)) return createMessage("That's not a number!")
			let count = (args == 0) ? 1 : args[0]; let egg = '';
			for (let i = 0; i < count; i++) egg = egg + '🥚';
			createMessage(egg);
			break

		case 'msgself': createMessage(args[0]); break

		case 'clear': messages.innerHTML = ''; break

		case 'tp':
			if (!coordsValid(args)) return createMessage("Invalid coords!");
			camera.position.set(args[0], args[1], args[2]);
			createMessage(`Teleported to ${args}`);
			break

		case 'look':
			if (!coordsValid(args)) return createMessage("Invalid coords!");
			camera.lookAt(args[0], args[1], args[2]);
			createMessage(`Looked to ${args}`);
			break

		case 'flook':
			if (args == 'stop') { flook = ''; return createMessage("Stopped flooking") };
			if (!coordsValid(args)) return createMessage("Invalid coords!");
			flook = args;
			createMessage(`Flooking at ${args}`);
			break

		case 'sun':
			if (args == 'reset') { sun.position.set(20, 90, 50); return createMessage('Resetted sun') }
			if (!coordsValid(args)) return createMessage("Invalid coords!");
			sun.position.set(args[0], args[1], args[2]);
			sun.shadow.needsUpdate = true;
			createMessage(`Repositioned sun`)
			break



		default: createMessage(`Command ${command} does not exist`); break
	}} catch(err) { createMessage(err); throw err }
}
*/