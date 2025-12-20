const { cmd } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd({
    pattern: "song",
    react: "🎶",
    desc: "Download MP3 Songs (Up to 60 min).",
    category: "download",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ *කරුණාකර සින්දුවේ නම හෝ YouTube ලින්ක් එක ලබා දෙන්න.*");

        const loading = await zanta.sendMessage(from, { text: "🔍 *Searching for your song...*" }, { quoted: mek });

        const search = await yts(q);
        const data = search.videos[0];
        if (!data) return await zanta.sendMessage(from, { text: "❌ *සින්දුව සොයාගත නොහැකි විය._Try .ytmp3 command_*", edit: loading.key });

        const botName = global.CURRENT_BOT_SETTINGS.botName;

        // කාලය පරීක්ෂා කිරීම (විනාඩි 60 = තත්පර 3600)
        let durationParts = data.timestamp.split(":").map(Number);
        let seconds = durationParts.length === 3 ? (durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]) : (durationParts[0] * 60 + durationParts[1]);

        if (seconds > 3600) {
            return await zanta.sendMessage(from, { text: "⏳ *සමාවන්න, විනාඩි 60 ට වැඩි Audio දැනට සහය නොදක්වයි.*", edit: loading.key });
        }

        let desc = `
╭━─━─━─━─━─━─━─━╮
┃ *${botName} SONG DOWNLOADER*
╰━─━─━─━─━─━─━─━╯

🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
📅 *Uploaded:* ${data.ago}
👀 *Views:* ${data.views.toLocaleString()}
`;

        await zanta.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        const songData = await ytmp3(data.url, "192");

        await zanta.sendMessage(from, { text: "✅ *Download Completed!*", edit: loading.key });

        await zanta.sendMessage(from, {
            audio: { url: songData.download.url },
            mimetype: "audio/mpeg",
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
