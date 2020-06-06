"use strict";
const fs = require("fs");

var decks = [];

function load_deck(deck_path) { 
	const deck_text = fs.readFileSync(deck_path, { encoding: "ASCII" });
	const deck_array = deck_text.split("\n");
	var deck = {
		main: [],
		side: []
	};
	var current_deck = deck.main;
	for (var line of deck_array) { 
		if (line.indexOf("!side") >= 0) { 
			current_deck = deck.side;
			continue;
		}
		const card = parseInt(line);
		if (!isNaN(card)) { 
			current_deck.push(card);
		}
	}
	decks.push(deck);
}

function init() { 
	var list = fs.readdirSync("./windbot/Decks");
	for (var file of list) { 
		if (file === "AI_Test.ydk") { 
			continue;
		}
		const deck_path = "./windbot/Decks/" + file;
		load_deck(deck_path);
	}
	log.info("AITag:", decks.length, "AI decks loaded");
}

init();

ygopro.ctos_follow_before("CHAT", true, async (buffer, info, client, server, datas) => {
	var room = ROOM_all[client.rid];
	if (!room) {
		return;
	}
	const msg = _.trim(info.msg);
	const cmd = msg.split(' ');
	if (cmd[0] === "/ai") { 
		const name = cmd[1];
		var windbot;
		if (name) {
			windbot = _.sample(_.filter(windbots, function(w) {
				return w.name === name || w.deck === name;
			}));
			if (!windbot) {
				ygopro.stoc_send_chat(client, "${windbot_deck_not_found}", ygopro.constants.COLORS.RED);
				return true;
			}
		} else {
			windbot = _.sample(windbots);
		}
		room.add_windbot(windbot);
		return true;
	}
	return false;
});

ygopro.ctos_follow_after("UPDATE_DECK", false, async (buffer, info, client, server, datas) => {
	var room = ROOM_all[client.rid];
	if (!room || client.is_local || client.pre_reconnecting) {
		return;
	}
	const deck = _.sample(decks);
	client.main = deck.main;
	client.side = deck.side;
	var struct = ygopro.structs["deck"];
	struct._setBuff(buffer);
	struct.set("mainc", deck.main.length);
	struct.set("sidec", deck.side.length);
	struct.set("deckbuf", deck.main.concat(deck.side));
	buffer = struct.buffer;
});

ygopro.stoc_follow_before("DUEL_START", false, async (buffer, info, client, server, datas) => {
	var room = ROOM_all[client.rid];
	if (room && room.windbot) { 
		room.windbot = null;
	}
});

ygopro.stoc_follow_after("CHANGE_SIDE", true, async (buffer, info, client, server, datas) => {
	var room = ROOM_all[client.rid];
	if (!room) {
		return false;
	}
	ygopro.ctos_send(server, "UPDATE_DECK", {
		mainc: client.main.length,
		sidec: client.side.length,
		deckbuf: client.main.concat(client.side)
	});
	if (client.side_interval) {
		clearInterval(client.side_interval);
	}
	return true;
});
