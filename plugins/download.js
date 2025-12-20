const { cmd } = require("../command");
const axios = require('axios');

cmd({
    pattern: "apk",
    alias: ["app", "playstore"],
    react: "📦",
    desc: "Search and download APK files from multiple sources.",
    category: "download",
    filename: __filename
}, async (zanta, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ *කරුණාකර ඇප් එකේ නම ලබා දෙන්න. (Ex: .apk FB)*");

        await reply(`🔍 *"${q}" සොයමින් පවතී...*`);

        let appData = null;

        // --- ක්‍රමය 1: BK9 API (දැනට වැඩ කරන ස්ථාවරම එක) ---
        try {
            const res1 = await axios.get(`https://bk9.fun/download/apk?q=${encodeURIComponent(q)}`);
            if (res1.data && res1.data.status && res1.data.BK9) {
                appData = {
                    name: res1.data.BK9.name,
                    icon: res1.data.BK9.icon,
                    size: res1.data.BK9.size,
                    package: res1.data.BK9.id,
                    dl: res1.data.BK9.dllink
                };
            }
        } catch (e) { console.log("Method 1 failed"); }

        // --- ක්‍රමය 2: වැඩ නැත්නම් (Fallback to Shinoa API) ---
        if (!appData) {
            try {
                const res2 = await axios.get(`https://api.shinoa.xyz/api/apk/search?q=${encodeURIComponent(q)}`);
                if (res2.data && res2.data.result.length > 0) {
                    const id = res2.data.result[0].id;
                    const dlRes = await axios.get(`https://api.shinoa.xyz/api/apk/download?id=${id}`);
                    appData = {
                        name: dlRes.data.result.name,
                        icon: dlRes.data.result.icon,
                        size: dlRes.data.result.size,
                        package: dlRes.data.result.package,
                        dl: dlRes.data.result.download
                    };
                }
            } catch (e) { console.log("Method 2 failed"); }
        }

        if (!appData || !appData.dl) {
            return reply("❌ *කණගාටුයි, කිසිදු සර්වර් එකකින් මෙම ඇප් එක සොයාගත නොහැකි විය.*");
        }

        // --- Size Limit (250MB) ---
        const sizeStr = appData.size || "0 MB";
        const sizeVal = parseFloat(sizeStr);
        if (sizeStr.toLowerCase().includes('gb') || (sizeStr.toLowerCase().includes('mb') && sizeVal > 250)) {
            return reply(`⏳ *ප්‍රමාණය වැඩි බැවින් (${sizeStr}) බොට් හරහා ලබා දිය නොහැක.*`);
        }

        const botName = global.CURRENT_BOT_SETTINGS?.botName || "ZANTA-MD";
        let desc = `
╭━─━─━─━─━─━─━─━╮
┃    *📦 APK DOWNLOADER*
╰━─━─━─━─━─━─━─━╯

📛 *Name:* ${appData.name}
⚖️ *Size:* ${appData.size}
📦 *Package:* ${appData.package}

🔄 *ඔබගේ APK එක එවනු ලැබේ. රැඳී සිටින්න...*

> *© ${botName}*`;

        await zanta.sendMessage(from, { image: { url: appData.icon }, caption: desc }, { quoted: mek });

        // APK එක එවමු
        await zanta.sendMessage(from, {
            document: { url: appData.dl },
            mimetype: "application/vnd.android.package-archive",
            fileName: `${appData.name}.apk`,
            caption: `*✅ ${appData.name} Success!*`
        }, { quoted: mek });

    } catch (e) {
        console.error("APK Final Error:", e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

// 🕺 TIKTOK DOWNLOADER (FIXED)
cmd({
    pattern: "tiktok",
    alias: ["ttdl", "tt"],
    react: "🕺",
    desc: "Download TikTok Video without watermark.",
    category: "download",
    filename: __filename
}, async (zanta, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("❌ *කරුණාකර TikTok Link එකක් ලබා දෙන්න.*");

        // ලින්ක් එක පිරිසිදු කිරීම
        let inputUrl = q.trim();
        if (!inputUrl.includes("tiktok.com")) return reply("❌ *කරුණාකර වලංගු TikTok Link එකක් ලබා දෙන්න.*");

        await reply("🔄 *TikTok වීඩියෝව ලබා ගනිමින් පවතී...*");

        // Tikwm API එක පාවිච්චි කරමු (මේක ගොඩක් ස්ථාවරයි)
        const response = await axios.get(`https://www.tikwm.com/api/?url=${inputUrl}`);
        const data = response.data;

        if (!data || !data.data || !data.data.play) {
            return reply("❌ *වීඩියෝව සොයාගත නොහැකි විය. ලින්ක් එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.*");
        }

        const videoData = data.data;
        const botName = global.CURRENT_BOT_SETTINGS?.botName || "ZANTA-MD";

        await zanta.sendMessage(from, {
            video: { url: videoData.play }, // No watermark video
            mimetype: "video/mp4",
            caption: `
╭━─━─━─━─━─━─━─━╮
┃    *🕺 TIKTOK DOWNLOADER*
╰━─━─━─━─━─━─━─━╯

👤 *Creator:* ${videoData.author.unique_id}
📝 *Title:* ${videoData.title || 'TikTok Video'}
📊 *Views:* ${videoData.play_count}
❤️ *Likes:* ${videoData.digg_count}

> *© ${botName}*`
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
