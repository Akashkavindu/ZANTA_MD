const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "ZMFX2DiT#PYXteiUFKg6bl1wkgpzFZRRtkgD8HmRjG4SF-XvJTnU",
ALIVE_IMG: process.env.ALIVE_IMG || "https://github.com/Akashkavindu/ZANTA_MD/blob/main/images/ChatGPT%20Image%20Nov%2020,%202025,%2009_47_50%20PM.png?raw=true",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 ZANTA-MD Is Alive Now😍*\n\n> ZANTA MD WA BOT",
BOT_OWNER: '94743404814',  // Replace with the owner's phone number



};
