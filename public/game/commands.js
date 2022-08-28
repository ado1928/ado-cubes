import * as MAIN from './main.js';

export function execute() {
	let args = MAIN.escapeHTML(inputChat.value).slice(1).split(" ");
	let command = args[0]; args.shift()
	inputChat.value = '';

	for (let i = 0; i < args.length; i++) {
		if (!isNaN(args[i])) args[i] = parseInt(args[i]);
	}; console.log(args);

	try { switch (command) {
		case 'egg':
			if (isNaN(args)) { MAIN.createMessage("That's not a number!"); return };
			let count = (args == 0) ? 1 : args[0]; let egg = '';
			for (let i = 0; i < count; i++) egg = egg + '🥚';
			MAIN.createMessage(egg);
			break

		case 'tp':
			if (args.length < 3) { MAIN.createMessage("One or more coord is missing!"); return };
			MAIN.camera.position.set(args[0], args[1], args[2]);
			MAIN.createMessage(`Teleported to ${args[0]} ${args[1]} ${args[2]}`)
			break

		case 'msgself':
			MAIN.createMessage(args[0])
			break

		case 'clear':
			MAIN.createMessage("This is supposed to clear the messsages in the chat but for some reason .remove() doesn't work >:(")
			break

		default:
			MAIN.createMessage(`Command ${command} does not exist`)
		break
	}} catch(err) { MAIN.createMessage(err) }
}
