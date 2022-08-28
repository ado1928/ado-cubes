import * as main from './main.js'

export function execute() {
	let command = main.escapeHTML(inputChat.value).slice(1).split(" ");
	switch (command[0]) {
		case "egg":
			let count = command[1] || 1; let egg = "";
			for (let i = 0; i < count; i++) egg = egg + "🥚"
			main.createMessage(egg);
			break
		default:
			main.createMessage("Command " + command[0] + " does not exist")
		break
	}
	inputChat.value = ""
}
