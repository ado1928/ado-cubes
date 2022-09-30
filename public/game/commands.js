import { createMessage, escapeHTML } from './main.js'

export var flook;

export function executeCommand(cmd) {
	let args = escapeHTML(cmd).slice(1).split(" ");
	let command = args[0].toLowerCase(); args.shift()
	inputChat.value = '';

	for (let i = 0; i < args.length; i++) {
		if (!isNaN(args[i])) args[i] = parseInt(args[i]);
	}; console.log(args);

	try { switch (command) {
		case 'egg':
			if (isNaN(args)) { createMessage("That's not a number!"); return };
			let count = (args == 0) ? 1 : args[0]; let egg = '';
			for (let i = 0; i < count; i++) egg = egg + '🥚';
			createMessage(egg);
			break

		case 'tp':
			if (args.length < 3) { createMessage("One or more coord is missing!"); return };
			for (let i = 0; i < args.length; i++) if (isNaN(args[i])) { createMessage(`Coord ${args[i]} is invalid!`); return };
			camera.position.set(args[0], args[1], args[2]);
			createMessage(`Teleported to ${args}`)
			break

		case 'flook':
			if (args.length < 3) {
				flook = '';
				createMessage('Stopped flooking');
				return
			};
			flook = args;
			createMessage(`Flooking at ${args}`)
			break

		case 'msgself': createMessage(args[0]); break

		case 'clear': messages.innerHTML = ''; break

		default: createMessage(`Command ${command} does not exist`); break
	}} catch(err) { createMessage(err); throw err }
}
