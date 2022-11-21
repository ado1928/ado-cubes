import { createMessage, camera, sun } from './main.js'
import { escapeHTML, coordsValid } from './utils.js';

export var flook;

export function executeCommand() {
	let args = escapeHTML(inputChat.value).slice(1).split(" ");
	let command = args[0].toLowerCase(); args.shift();
	inputChat.value = '';

	for (let i = 0; i < args.length; i++) if (!isNaN(args[i])) args[i] = parseInt(args[i]);
	//console.log(args);

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
