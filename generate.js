"use strict";
const fs = require("fs");
const list = fs.readdirSync(process.argv[2]);
var res = {windbots: []};
for (var filename of list) {
	const deck_name = filename.match(/AI_(.+)\.ydk/);
	if(deck_name){
		const parsed_name = deck_name[1];
		res.windbots.push({
			name: parsed_name,
			deck: parsed_name,
			dialog: "default.json"
		});
	}
}
console.log(JSON.stringify(res, null, 2));
