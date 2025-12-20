const { cmd } = require("../command");
const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');

ffmpeg.setFfmpegPath(ffmpegPath);

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// 🗝️ Remove.bg API Key (Get from remove.bg)
const REMOVE_BG_API_KEY = "vGc2DJRV25qEAWbU26YaQV2R"; 

/**
 * Media බාගත කිරීමේ ක්‍රියාවලිය
 */
const downloadMedia = async (message, type) => {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (e) {
        return null;
    }
};

/**
 * Media Type එක හරියටම සොයාගැනීමේ logic එක (Deep Search)
 */
const getMedia = (quoted) => {
    if (!quoted) return null;
    let msg = quoted.message || quoted.msg || quoted;
    
    if (msg.imageMessage) return { data: msg.imageMessage, type: 'image' };
    if (msg.videoMessage) return { data: msg.videoMessage, type: 'video' };
    if (msg.stickerMessage) return { data: msg.stickerMessage, type: 'sticker' };
    
    let context = msg.extendedTextMessage?.contextInfo?.quotedMessage;
    if (context) {
        if (context.imageMessage) return { data: context.imageMessage, type: 'image' };
        if (context.videoMessage) return { data: context.videoMessage, type: 'video' };
        if (context.stickerMessage) return { data: context.stickerMessage, type: 'sticker' };
    }
    
    if (quoted.imageMessage) return { data: quoted.imageMessage, type: 'image' };
    if (quoted.videoMessage) return { data: quoted.videoMessage, type: 'video' };
    if (quoted.stickerMessage) return { data: quoted.stickerMessage, type: 'sticker' };
    
    return null;
};

// 1. 🖼️ IMAGE/VIDEO TO STICKER (.s)
cmd({
    pattern: "s",
    alias: ["sticker", "st"],
    react: "🌟",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, quoted }) => {
    try {
        let media = getMedia(quoted);
        if (!media || (media.type !== 'image' && media.type !== 'video')) return reply("*කරුණාකර ඡායාරූපයකට හෝ වීඩියෝවකට Reply කරන්න!* ❌");

        reply("*ස්ටිකර් එක සාදමින් පවතී...* ⏳");
        const buffer = await downloadMedia(media.data, media.type);
        const inPath = path.join(tempDir, `temp_${Date.now()}`);
        const outPath = path.join(tempDir, `st_${Date.now()}.webp`);
        fs.writeFileSync(inPath, buffer);

        ffmpeg(inPath)
            .on('end', async () => {
                await zanta.sendMessage(from, { sticker: fs.readFileSync(outPath), packname: "ZANTA-MD", author: "Sticker-Bot" }, { quoted: mek });
                fs.unlinkSync(inPath); fs.unlinkSync(outPath);
            })
            .on('error', (e) => { reply("Error!"); fs.unlinkSync(inPath); })
            .addOutputOptions(["-vcodec", "libwebp", "-vf", "scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(320-iw)/2:(320-ih)/2:color=white@0.0"])
            .save(outPath);
    } catch (e) { reply("Error!"); }
});

// 2. 🎡 STICKER TO IMAGE (.toimg)
cmd({
    pattern: "toimg",
    react: "🖼️",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, quoted }) => {
    try {
        let media = getMedia(quoted);
        if (!media || media.type !== 'sticker') return reply("*කරුණාකර ස්ටිකර් එකකට Reply කරන්න!* ❌");

        reply("*පින්තූරය ලබාගනිමින් පවතී...* ⏳");
        const buffer = await downloadMedia(media.data, 'sticker');
        const inPath = path.join(tempDir, `st_in_${Date.now()}.webp`);
        const outPath = path.join(tempDir, `img_${Date.now()}.png`);
        fs.writeFileSync(inPath, buffer);

        ffmpeg(inPath)
            .on('end', async () => {
                await zanta.sendMessage(from, { image: fs.readFileSync(outPath), caption: "> *ZANTA-MD Convert*" }, { quoted: mek });
                fs.unlinkSync(inPath); fs.unlinkSync(outPath);
            })
            .save(outPath);
    } catch (e) { reply("Error!"); }
});

// 3. 🎶 VIDEO TO MP3 (.tomp3)
cmd({
    pattern: "tomp3",
    alias: ["toaudio"],
    react: "🎶",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, quoted }) => {
    try {
        let media = getMedia(quoted);
        if (!media || media.type !== 'video') return reply("*වීඩියෝවකට Reply කරන්න!* ❌");

        reply("*MP3 එක සාදමින් පවතී...* ⏳");
        const buffer = await downloadMedia(media.data, 'video');
        const inPath = path.join(tempDir, `vid_${Date.now()}.mp4`);
        const outPath = path.join(tempDir, `aud_${Date.now()}.mp3`);
        fs.writeFileSync(inPath, buffer);

        ffmpeg(inPath).toFormat('mp3').audioBitrate('128k')
            .on('end', async () => {
                await zanta.sendMessage(from, { audio: fs.readFileSync(outPath), mimetype: 'audio/mpeg', fileName: `ZANTA.mp3` }, { quoted: mek });
                fs.unlinkSync(inPath); fs.unlinkSync(outPath);
            })
            .on('error', () => { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); })
            .save(outPath);
    } catch (e) { reply("Error!"); }
});

// 4. 🔗 MEDIA TO URL (.tourl)
cmd({
    pattern: "tourl",
    alias: ["url"],
    react: "🔗",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, quoted }) => {
    try {
        let media = getMedia(quoted);
        if (!media || (media.type !== 'image' && media.type !== 'video')) return reply("*Media එකකට Reply කරන්න!* ❌");

        reply("*URL එක සාදමින් පවතී...* ⏳");
        const buffer = await downloadMedia(media.data, media.type);
        const form = new FormData();
        form.append('fileToUpload', buffer, 'zanta.jpg');
        form.append('reqtype', 'fileupload');

        const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
        reply(`*🔗 Media URL:* \n${res.data}`);
    } catch (e) { reply("*Error uploading media!*"); }
});

// 5. 🏁 TEXT TO QR (.toqr)
cmd({
    pattern: "toqr",
    react: "🏁",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, args }) => {
    try {
        let text = args.join(" ");
        if (!text) return reply("*වචනයක් හෝ ලින්ක් එකක් ලබාදෙන්න!* ❌");
        let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
        await zanta.sendMessage(from, { image: { url: qrUrl }, caption: `*QR for:* ${text}` }, { quoted: mek });
    } catch (e) { reply("Error!"); }
});

// 6. ✂️ REMOVE BG (.removebg)
cmd({
    pattern: "removebg",
    alias: ["rmbg"],
    react: "✂️",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, quoted }) => {
    try {
        let media = getMedia(quoted);
        if (!media || media.type !== 'image') return reply("*ඡායාරූපයකට Reply කරන්න!* ❌");

        reply("*පසුබිම ඉවත් කරමින් පවතී...* ⏳");

        const buffer = await downloadMedia(media.data, 'image');
        if (!buffer) return reply("*ඡායාරූපය බාගත කිරීම අසාර්ථකයි!*");

        const form = new FormData();
        form.append('size', 'auto');
        form.append('image_file', buffer, { filename: 'image.jpg' });

        const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
            headers: { 
                ...form.getHeaders(), 
                'X-Api-Key': REMOVE_BG_API_KEY // මෙහිදී ඉහළින් ඇති Key එක ස්වයංක්‍රීයව ගනු ලබයි
            },
            responseType: 'arraybuffer'
        });

        await zanta.sendMessage(from, { 
            image: Buffer.from(res.data), 
            caption: "> *Background Removed by ZANTA-MD*" 
        }, { quoted: mek });

    } catch (e) { 
        console.error(e);
        reply("*Error! API Key එක වැරදි හෝ මාසික සීමාව (Credits 50) අවසන් වී තිබිය හැක.*"); 
    }
});

// 7. 🎨 AI IMAGE GENERATOR (.gen)
cmd({
    pattern: "genimg",
    alias: ["aiimg", "draw"],
    react: "🎨",
    category: "media",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, args }) => {
    try {
        let text = args.join(" ");
        if (!text) return reply("*කරුණාකර ඔබට අවශ්‍ය පින්තූරය ගැන විස්තරයක් ලබා දෙන්න!* ❌\n\n*උදාහරණය:* .gen a futuristic city in Sri Lanka*");

        reply("*ඔබේ පින්තූරය නිර්මාණය කරමින් පවතී...* ⏳");

        let apiUrl = `https://pollinations.ai/p/${encodeURIComponent(text)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;

        await zanta.sendMessage(from, { 
            image: { url: apiUrl }, 
            caption: `*🎨 AI Image Generated By ZANTA-MD*\n\n*Prompt:* ${text}\n\n> *No API Key Needed - Unlimited!*` 
        }, { quoted: mek });

    } catch (e) {
        reply("*Error generating AI image!* ❌");
    }
});

module.exports = {};

cmd({
    pattern: "fancy",
    alias: ["font", "style", "text"],
    react: "✍️",
    desc: "Convert text into 15+ stylish fonts.",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("✍️ *කරුණාකර ඔබට අවශ්‍ය වචනය ලබා දෙන්න.*");

        const normalChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        const styles = {
            "𝖲𝖺𝗇𝗌": "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹𝖺 digital𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫",
            "𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄": "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
            "𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎": "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
            "𝔊𝔬𝔱𝔥𝔦𝔠": "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
            "ℂ𝕦𝕣𝕤𝕚𝕧𝕖": "𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
            "🅂🅀🅄🄰🅁🄴": "🄰🄱🄲🄳🄴🄵🄶🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅content🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉0123456789",
            "B🅤🅑🅑🅛🅗🅢": "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ⓪①②③④⑤⑥⑦⑧⑨",
            "C̳o̳m̳b̳i̳n̳i̳n̳g̳": "A̳B̳C̳D̳E̳F̳G̳H̳I̳J̳K̳L̳M̳N̳O̳P̳Q̳R̳S̳T̳U̳V̳W̳X̳Y̳Z̳a̳b̳c̳d̳e̳f̳g̳h̳i̳j̳k̳l̳m̳n̳o̳p̳q̳r̳s̳t̳u̳v̳w̳x̳y̳z̳0̳1̳2̳3̳4̳5̳6̳7̳8̳9̳",
            "S̶t̶r̶i̶k̶e̶": "A̶B̶C̶D̶E̶F̶G̶H̶I̶J̶K̶L̶M̶N̶O̶P̶Q̶R̶S̶T̶U̶V̶W̶X̶Y̶Z̶a̶b̶c̶d̶e̶f̶g̶h̶i̶j̶k̶l̶m̶n̶o̶p̶q̶r̶s̶t̶u̶v̶w̶x̶y̶z̶0̶1̶2̶3̶4̶5̶6̶7̶8̶9̶",
            "Gᵣₑₑₖ ₛₜyₗₑ": "αв¢∂єƒgнιנкℓмησρףяѕтυνωχуչαв¢∂єƒgнιנкℓмησρףяѕтυνωχуչ0123456789",
            "Fৡৢ͜͡ancy": "Aৡৢ͜͡Bৡৢ͜͡Cৡৢ͜͡Dৡৢ͜͡Eৡৢ͜͡Fৡৢ͜͡Gৡৢ͜͡Hৡৢ͜͡Iৡৢ͜͡Jৡৢ͜͡Kৡৢ͜͡Lৡৢ͜͡Mৡৢ͜͡Nৡৢ͜͡Oৡৢ͜͡Pৡৢ͜͡Qৡৢ͜͡Rৡৢ͜͡Sৡৢ͜͡Tৡৢ͜͡Uৡৢ͜͡Vৡৢ͜͡Wৡৢ͜͡Xৡৢ͜͡Yৡৢ͜͡Zৡৢ͜͡",
            "Uᴩꜱɪᴅᴇ Dᴏᴡɴ": "ⱯᗺϽᗡƎℲƃHIᒋʞꞀWNOԀÒᴚS⟘∩ɅMX⅄Zɐqɔpǝɟƃɥıɾʞꞁɯuodbɹsʇnʌʍxʎz0123456789"
        };

        let result = `✨ *ZANTA-MD ADVANCED FONTS* ✨\n\n`;

        for (let styleName in styles) {
            let styledText = "";
            let styleAlphabet = styles[styleName];

            for (let char of q) {
                let index = normalChars.indexOf(char);
                if (index !== -1) {
                    // ඇතැම් අකුරු යුනිකෝඩ් නිසා දිග වෙනස් විය හැක
                    // ඒ නිසා අපි සාමාන්‍ය ක්‍රමයට වඩා දියුණු ක්‍රමයක් බලමු
                    // මෙහිදී බොහොමයක් ස්ටයිල් සඳහා සරල mapping එකක් කරමු
                    let charLength = Math.floor(styleAlphabet.length / normalChars.length);
                    styledText += styleAlphabet.substr(index * charLength, charLength).trim();
                } else {
                    styledText += char;
                }
            }
            result += `📍 *${styleName}*\n${styledText}\n\n`;
        }

        result += `> *© ZANTA-MD 2024*`;
        await reply(result);

    } catch (err) {
        console.error(err);
        reply("❌ Fonts generate කිරීමේදී දෝෂයක් සිදු විය.");
    }
});

cmd({
    pattern: "art",
    alias: ["styletext", "ascii"],
    react: "🎨",
    desc: "Convert text into ASCII art symbols (Max 6 letters).",
    category: "convert",
    filename: __filename,
}, async (zanta, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("🎨 *කරුණාකර වචනයක් ලබා දෙන්න. (උදා: .ascii ZANTA)*");

        // අකුරු 6 සීමාව පරීක්ෂා කිරීම
        if (q.length > 6) {
            return reply("⚠️ *වැඩිම වුනොත් අකුරු 6ක් පමණක් ලබා දෙන්න. (නැතිනම් රූපය විකෘති වේ)*");
        }

        // වචනය අකුරු රූපයක් බවට පත් කිරීම
        figlet(q, function(err, data) {
            if (err) {
                console.log('Something went wrong...');
                return reply("❌ ASCII රූපය සෑදීමේදී දෝෂයක් විය.");
            }

            // මැසේජ් එක යැවීමේදී කෝඩ් බ්ලොක් එකක් ඇතුලේ යැවිය යුතුයි
            const artResult = "```" + data + "```";

            const botName = global.CURRENT_BOT_SETTINGS?.botName || "ZANTA-MD";

            reply(`🎨 *ASCII ART GENERATOR*\n\n${artResult}\n\n> *© ${botName}*`);
        });

    } catch (err) {
        console.error(err);
        reply("❌ දෝෂයක් සිදු විය.");
    }
});
