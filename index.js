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

ygopro.ctos_follow_after("UPDATE_DECK", false, (buffer, info, client, server, datas) => {
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

ygopro.stoc_follow_before("DUEL_START", false, (buffer, info, client, server, datas) => {
	var room = ROOM_all[client.rid];
	if (room && room.windbot) { 
		room.windbot = null;
	}
});

ygopro.stoc_follow_after("CHANGE_SIDE", true, (buffer, info, client, server, datas) => {
	var room = ROOM_all[client.rid];
	if (!room) {
		return false;
	}
	ygopro.ctos_send(server, {
		mainc: client.main.length,
		sidec: client.side.length,
		deckbuf: deck_main.concat(deck_side)
	});
	if (client.side_interval) {
		clearInterval(client.side_interval);
	}
	return true;
});
