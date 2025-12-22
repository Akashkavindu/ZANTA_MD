const { cmd } = require("../command");
const { ytmp4, ytmp3 } = require("@vreden/youtube_scraper");
const yts = require("yt-search");
const axios = require('axios');

// --- 🛠️ Core Helper Function ---
async function downloadYoutubeVreden(url, format, zanta, from, mek, reply, data) {
    if (!url) return reply("❌ Invalid YouTube URL.");

    let durationParts = data.timestamp.split(":").map(Number);
    let totalSeconds = durationParts.length === 3 
        ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2] 
        : durationParts[0] * 60 + durationParts[1];

    if (format === 'mp4' && totalSeconds > 300) return reply("⏳ *වීඩියෝව විනාඩි 5 කට වඩා වැඩි බැවින් බාගත කළ නොහැක.*");
    if (format === 'mp3' && totalSeconds > 3600) return reply("⏳ *සින්දුව විනාඩි 60 කට වඩා වැඩි බැවින් බාගත කළ නොහැක.*");

    const botName = global.CURRENT_BOT_SETTINGS?.botName || "Zanta-MD";
    let tempMsg;

    try {
        let quality = (format === 'mp4') ? '480' : '192';
        tempMsg = await reply(`*📥 Downloading ${format.toUpperCase()}...*\n\n🎬 *Title:* ${data.title}\n⭐ *Quality:* ${format === 'mp4' ? '480p' : '192kbps'}`);

        let finalData = (format === 'mp4') ? await ytmp4(url, quality) : await ytmp3(url, quality);

        if (!finalData || !finalData.download || !finalData.download.url) {
            if (format === 'mp4') finalData = await ytmp4(url, '360');
            if (!finalData || !finalData.download || !finalData.download.url) {
                return await zanta.sendMessage(from, { text: "❌ *බාගත කිරීමේ ලින්ක් එක ලබා ගැනීමට නොහැකි විය.*", edit: tempMsg.key });
            }
        }

        const response = await axios.get(finalData.download.url, { responseType: 'arraybuffer', timeout: 300000 });
        const mediaBuffer = response.data;
        const caption = `*✅ Download Complete!*\n\n🎬 *Title:* ${data.title}\n⏱️ *Duration:* ${data.timestamp}\n\n> *© ${botName}*`;

        if (format === 'mp4') {
            await zanta.sendMessage(from, { video: mediaBuffer, caption: caption, mimetype: 'video/mp4' }, { quoted: mek });
        } else {
            await zanta.sendMessage(from, { audio: mediaBuffer, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: mek });
        }

        return await zanta.sendMessage(from, { text: `*වැඩේ හරි 🙃✅*`, edit: tempMsg.key });

    } catch (e) {
        console.error(e);
        if (tempMsg) await zanta.sendMessage(from, { text: `❌ *Error:* ${e.message}`, edit: tempMsg.key });
    }
}

// --- 🛠️ ලින්ක් එකෙන් ID එක වෙන් කරගන්නා Function එක ---
function getYouTubeID(url) {
    let regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    let match = url.match(regex);
    return (match && match[1]) ? match[1] : null;
}

// --- 🎞️ YT MP4 Command ---
cmd({
    pattern: "ytmp4",
    alias: ["video", "vid"],
    react: "🎞️",
    category: "download",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, q }) => {
    if (!q) return reply("❌ *YouTube ලින්ක් එකක් හෝ නමක් ලබා දෙන්න.*");
    
    try {
        let videoInfo;
        let videoId = getYouTubeID(q);

        if (videoId) {
            // ලින්ක් එකක් නම් ID එකෙන් විස්තර ගමු
            const search = await yts({ videoId: videoId });
            videoInfo = search;
        } else {
            // නමක් නම් සර්ච් කරමු
            const search = await yts(q);
            videoInfo = search.videos[0];
        }

        if (!videoInfo || !videoInfo.url) return reply("❌ *වීඩියෝව සොයාගත නොහැකි විය.*");

        await downloadYoutubeVreden(videoInfo.url, 'mp4', zanta, from, mek, reply, videoInfo);
    } catch (e) {
        reply("❌ දෝෂයකි: " + e.message);
    }
});

// --- 🎶 YT MP3 Command ---
cmd({
    pattern: "ytmp3",
    alias: ["song", "ytaudio"],
    react: "🎶",
    category: "download",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, q }) => {
    if (!q) return reply("❌ *YouTube ලින්ක් එකක් හෝ නමක් ලබා දෙන්න.*");

    try {
        let videoInfo;
        let videoId = getYouTubeID(q);

        if (videoId) {
            const search = await yts({ videoId: videoId });
            videoInfo = search;
        } else {
            const search = await yts(q);
            videoInfo = search.videos[0];
        }

        if (!videoInfo || !videoInfo.url) return reply("❌ *සින්දුව සොයාගත නොහැකි විය.*");

        await downloadYoutubeVreden(videoInfo.url, 'mp3', zanta, from, mek, reply, videoInfo);
    } catch (e) {
        reply("❌ දෝෂයකි: " + e.message);
    }
});
