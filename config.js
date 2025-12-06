const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "pYl13TgQ#N6xg91sJuWP1n3I2aZsbPOywT4Hvx3H7DjH2elTOg0k",
ALIVE_IMG: process.env.ALIVE_IMG || "https://raw.githubusercontent.com/Akashkavindu/ZANTA_MD/refs/heads/main/images/ChatGPT%20Image%20Nov%2021%2C%202025%2C%2001_21_32%20AM.png",
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋...ZANTA-MD Is Alive Now😍*\n\n*You can contact me using this link*\n\nhttp://wa.me/+94743404814?text=*Hey__ZANTA*\n\n*You can join my whatsapp group*\n\n*https://chat.whatsapp.com/EChgJJtPHbY8IvrHApocWc*\n\n*You can join Our Whatsapp Chanel*\n\n*https://whatsapp.com/channel/0029VbBc42s84OmJ3V1RKd2B*\n\n> ZANTA MD WA BOT",
BOT_OWNER: '94743404814',  // Replace with the owner's phone number
AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || 'true', // 'true' හෝ 'false'
ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || 'true',      // 'true' හෝ 'false'    
};
