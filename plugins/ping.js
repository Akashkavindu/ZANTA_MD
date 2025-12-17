const { cmd } = require("../command");
const os = require('os');
const { runtime } = require('../lib/functions');

const STATUS_IMAGE_URL = "https://github.com/Akashkavindu/ZANTA_MD/blob/main/images/alive-new.jpg?raw=true";

function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

cmd({
    pattern: "ping",
    alias: ["status", "info"],
    react: "⚙️",
    desc: "Check bot speed and system status.",
    category: "main",
    filename: __filename,
},
async (zanta, mek, m, { from, reply }) => {
    try {
        const startTime = Date.now();

        // පණිවිඩය යවා එහි key එක ලබා ගනී (පසුව මැකීමට)
        const loadingMsg = await reply("*⚙️ Bot තොරතුරු එකතු කරමින්...*");

        const botName = global.CURRENT_BOT_SETTINGS.botName;
        const memoryUsage = process.memoryUsage();
        const latency = Date.now() - startTime;

        const statusMessage = `
*╭━━━*「 *${botName} STATUS* 」*━━━╮*
*┃ ⏱️ Response:* ${latency} ms
*┃ ⏳ Uptime:* ${runtime(process.uptime())}
*┃ 🌐 Platform:* ${os.platform()}
*┃ 💻 Node:* ${process.version}
*╰━━━━━━━━━━━━━━━━━━╯*

*╭━━━*「 *System Resources* 」*━━━╮*
*┃ 🧠 Process RAM:* ${bytesToSize(memoryUsage.rss)}
*┃ 📊 Total RAM:* ${bytesToSize(os.totalmem())}
*┃ 📊 Free RAM:* ${bytesToSize(os.freemem())}
*╰━━━━━━━━━━━━━━━━━━╯*
`;

        // අවසාන පණිවිඩය රූපය සමඟ යැවීම
        await zanta.sendMessage(from, {
            image: { url: STATUS_IMAGE_URL },
            caption: statusMessage.trim()
        }, { quoted: mek });

        // මුලින් යැවූ "තොරතුරු එකතු කරමින්" පණිවිඩය මැකීම
        await zanta.sendMessage(from, { delete: loadingMsg.key });

    } catch (e) {
        console.error("[PING ERROR]", e);
        reply(`*🚨 Error:* ${e.message}`);
    }
});
