const _0x5a1e = [
    "@whiskeysockets/baileys", "fs", "pino", "express", "path", "./config", "./lib/msg", "./lib/functions", "megajs", "./command",
    "./plugins/menu", "./plugins/settings", "./plugins/help", "./plugins/bot_db", "status@broadcast", "true", "composing", "recording",
    "@g.us", "settings", "menu", "help"
];

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers,
} = require(_0x5a1e[0]);

const fs = require(_0x5a1e[1]);
const P = require(_0x5a1e[2]);
const express = require(_0x5a1e[3]);
const path = require(_0x5a1e[4]);
const config = require(_0x5a1e[5]);
const { sms } = require(_0x5a1e[6]);
const { getGroupAdmins } = require(_0x5a1e[7]);
const { File } = require(_0x5a1e[8]);
const { commands, replyHandlers } = require(_0x5a1e[9]);

const { lastMenuMessage } = require(_0x5a1e[10]);
const { lastSettingsMessage } = require(_0x5a1e[11]);
const { lastHelpMessage } = require(_0x5a1e[12]);
const { connectDB, getBotSettings, updateSetting } = require(_0x5a1e[13]);

const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jid.split(':');
        return (decode[0] + '@' + decode[1].split('@')[1]) || jid;
    }
    return jid;
};

global.CURRENT_BOT_SETTINGS = {
    botName: config.DEFAULT_BOT_NAME,
    ownerName: config.DEFAULT_OWNER_NAME,
    prefix: config.DEFAULT_PREFIX,
};

const app = express();
const port = process.env.PORT || 8000;
const credsPath = path.join(__dirname, "/\x61\x75\x74\x68\x5f\x69\x6e\x66\x6f\x5f\x62\x61\x69\x6c\x65\x79\x73\x2f\x63\x72\x65\x64\x73\x2e\x6a\x73\x6f\x6e");
const messagesStore = {};

process.on('\x75\x6e\x63\x61\x75\x67\x68\x74\x45\x78\x63\x65\x70\x74\x69\x6f\x6e', (err) => {});
process.on('\x75\x6e\x68\x61\x6e\x64\x6c\x65\x64\x52\x65\x6a\x65\x63\x74\x69\x6f\x6e', (reason) => {});

async function ensureSessionFile() {
    if (!fs.existsSync(credsPath)) {
        if (!config.SESSION_ID) process.exit(1);
        const filer = File.fromURL(`\x68\x74\x74\x70\x73\x3a\x2f\x2f\x6d\x65\x67\x61\x2e\x6e\x7a\x2f\x66\x69\x6c\x65\x2f${config.SESSION_ID}`);
        filer.download((err, data) => {
            if (err) process.exit(1);
            fs.mkdirSync(path.join(__dirname, "/\x61\x75\x74\x68\x5f\x69\x6e\x66\x6f\x5f\x62\x61\x69\x6c\x65\x79\x73\x2f"), { recursive: true });
            fs.writeFileSync(credsPath, data);
            setTimeout(() => connectToWA(), 2000);
        });
    } else {
        setTimeout(() => connectToWA(), 1000);
    }
}

async function connectToWA() {
    await connectDB();
    global.CURRENT_BOT_SETTINGS = await getBotSettings();

    const pluginsPath = path.join(__dirname, "\x70\x6c\x75\x67\x69\x6e\x73");
    fs.readdirSync(pluginsPath).forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".\x6a\x73") {
            try { require(`./plugins/${plugin}`); } catch (e) {}
        }
    });

    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "/\x61\x75\x74\x68\x5f\x69\x6e\x66\x6f\x5f\x62\x61\x69\x6c\x65\x79\x73\x2f"));
    const { version } = await fetchLatestBaileysVersion();

    const zanta = makeWASocket({
        logger: P({ level: "\x73\x69\x6c\x65\x6e\x74" }),
        printQRInTerminal: false,
        browser: Browsers.macOS("\x46\x69\x72\x65\x66\x6f\x78"),
        auth: state,
        version,
        syncFullHistory: true,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
    });

    zanta.ev.on("\x63\x6f\x6e\x6e\x65\x63\x74\x69\x6f\x6e\x2e\x75\x70\x64\x61\x74\x65", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "\x63\x6c\x6f\x73\x65") {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) connectToWA();
        } else if (connection === "\x6f\x70\x65\x6e") {
            setInterval(async () => {
                const presence = global.CURRENT_BOT_SETTINGS.alwaysOnline === _0x5a1e[15] ? '\x61\x76\x61\x69\x6c\x61\x62\x6c\x65' : '\x75\x6e\x61\x76\x61\x69\x6c\x61\x62\x6c\x65';
                await zanta.sendPresenceUpdate(presence);
            }, 10000);

            const ownerJid = decodeJid(zanta.user.id);
            await zanta.sendMessage(ownerJid, {
                image: { url: `\x68\x74\x74\x70\x73\x3a\x2f\x2f\x67\x69\x74\x68\x75\x62\x2e\x63\x6f\x6d\x2f\x41\x6b\x61\x73\x68\x6b\x61\x76\x69\x6e\x64\x75\x2f\x5a\x41\x4e\x54\x41\x5f\x4d\x44\x2f\x62\x6c\x6f\x62\x2f\x6d\x61\x69\x6e\x2f\x69\x6d\x61\x67\x65\x73\x2f\x61\x6c\x69\x76\x65\x2d\x6e\x65\x77\x2e\x6a\x70\x67\x3f\x72\x61\x77\x3d\x74\x72\x75\x65` },
                caption: `${global.CURRENT_BOT_SETTINGS.botName} \x63\x6f\x6e\x6e\x65\x63\x74\x65\x64 \x20\x27\u2705\x0a\x0a\x50\x52\x45\x46\x49\x58\x3a ${global.CURRENT_BOT_SETTINGS.prefix}`,
            });
        }
    });

    zanta.ev.on("\x63\x72\x65\x64\x73\x2e\x75\x70\x64\x61\x74\x65", saveCreds);

    zanta.ev.on("\x6d\x65\x73\x73\x61\x67\x65\x73\x2e\x75\x70\x73\x65\x72\x74", async ({ messages }) => {
        const mek = messages[0];
        if (!mek || !mek.message) return;

        if (global.CURRENT_BOT_SETTINGS.autoStatusSeen === _0x5a1e[15] && mek.key.remoteJid === _0x5a1e[14]) {
            await zanta.readMessages([mek.key]);
            return;
        }

        if (mek.key.id && !mek.key.fromMe) messagesStore[mek.key.id] = mek;
        mek.message = getContentType(mek.message) === "\x65\x70\x68\x65\x6d\x65\x72\x61\x6c\x4d\x65\x73\x73\x61\x67\x65" ? mek.message.ephemeralMessage.message : mek.message;

        const m = sms(zanta, mek);
        const type = getContentType(mek.message);
        const from = mek.key.remoteJid;
        const body = type === "\x63\x6f\x6e\x76\x65\x72\x73\x61\x74\x69\x6f\x6e" ? mek.message.conversation : mek.message[type]?.text || mek.message[type]?.caption || "";

        const prefix = global.CURRENT_BOT_SETTINGS.prefix;
        const isCmd = body.startsWith(prefix);
        const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";
        const args = body.trim().split(/ +/).slice(1);

        const sender = mek.key.fromMe ? zanta.user.id : (mek.key.participant || mek.key.remoteJid);
        const decodedSender = decodeJid(sender);
        const decodedBot = decodeJid(zanta.user.id);
        const senderNumber = decodedSender.split("@")[0].replace(/[^\d]/g, '');
        const configOwner = config.OWNER_NUMBER.replace(/[^\d]/g, '');

        const isOwner = mek.key.fromMe || sender === zanta.user.id || decodedSender === decodedBot || senderNumber === configOwner;

        if (global.CURRENT_BOT_SETTINGS.autoRead === _0x5a1e[15]) await zanta.readMessages([mek.key]);
        if (global.CURRENT_BOT_SETTINGS.autoTyping === _0x5a1e[15]) await zanta.sendPresenceUpdate(_0x5a1e[16], from);
        if (global.CURRENT_BOT_SETTINGS.autoVoice === _0x5a1e[15] && !mek.key.fromMe) await zanta.sendPresenceUpdate(_0x5a1e[17], from);

        const botNumber2 = await jidNormalizedUser(zanta.user.id);
        const isGroup = from.endsWith(_0x5a1e[18]);
        const groupMetadata = isGroup ? await zanta.groupMetadata(from).catch(() => ({})) : {};
        const participants = isGroup ? groupMetadata.participants : [];
        const groupAdmins = isGroup ? participants.filter(p => p.admin !== null).map(p => p.id) : [];
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

        const reply = (text) => zanta.sendMessage(from, { text }, { quoted: mek });

        const isMenuReply = (m.quoted && lastMenuMessage && lastMenuMessage.get(from) === m.quoted.id);
        const isSettingsReply = (m.quoted && lastSettingsMessage && lastSettingsMessage.get(from) === m.quoted.id);
        const isHelpReply = (m.quoted && lastHelpMessage && lastHelpMessage.get(from) === m.quoted.id);

        if (isSettingsReply && body && !isCmd && isOwner) {
            const input = body.trim().split(" ");
            const num = input[0];
            const value = input.slice(1).join(" ");
            let dbKeys = ["", "botName", "ownerName", "prefix", "autoRead", "autoTyping", "autoStatusSeen", "alwaysOnline", "readCmd", "autoVoice"];
            let dbKey = dbKeys[parseInt(num)];
            if (dbKey) {
                let finalValue = (['4', '5', '6', '7', '8', '9'].includes(num)) ? ((value.toLowerCase() === '\x6f\x6e' || value.toLowerCase() === _0x5a1e[15]) ? _0x5a1e[15] : '\x66\x61\x6c\x73\x65') : value;
                if (await updateSetting(dbKey, finalValue)) {
                    global.CURRENT_BOT_SETTINGS[dbKey] = finalValue;
                    await reply(`\u2705 *${dbKey}* \x75\x70\x64\x61\x74\x65\x64`);
                    const cmd = commands.find(c => c.pattern === _0x5a1e[19]);
                    if (cmd) cmd.function(zanta, mek, m, { from, reply, isOwner, prefix });
                    return;
                }
            }
        }

        let shouldExecuteMenu = (isMenuReply && body && !body.startsWith(prefix));
        let shouldExecuteHelp = (isHelpReply && body && !body.startsWith(prefix));

        if (isCmd || shouldExecuteMenu || shouldExecuteHelp) {
            const execName = shouldExecuteHelp ? _0x5a1e[21] : (shouldExecuteMenu ? _0x5a1e[20] : commandName);
            const execArgs = (shouldExecuteHelp || shouldExecuteMenu) ? [body.trim().toLowerCase()] : args;
            const cmd = commands.find(c => c.pattern === execName || (c.alias && c.alias.includes(execName)));

            if (cmd) {
                if (global.CURRENT_BOT_SETTINGS.readCmd === _0x5a1e[15]) await zanta.readMessages([mek.key]);
                if (cmd.react) zanta.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                try {
                    cmd.function(zanta, mek, m, {
                        from, quoted: mek, body, isCmd, command: execName, args: execArgs, q: execArgs.join(" "),
                        isGroup, sender, senderNumber, botNumber2, botNumber: senderNumber, pushname: mek.pushName || "User",
                        isMe: mek.key.fromMe, isOwner, groupMetadata, groupName: groupMetadata.subject, participants,
                        groupAdmins, isBotAdmins, isAdmins, reply, prefix
                    });
                } catch (e) {}
            }
        }
    });
}

ensureSessionFile();
app.get("/", (req, res) => res.send(`\x42\x6f\x74\x20\x41\x6c\x69\x76\x65`));
app.listen(port, () => {});
