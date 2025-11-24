const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const axios = require('axios');
const path = require('path');
const qrcode = require('qrcode-terminal');

const config = require('./config');
const { sms, downloadMediaMessage } = require('./lib/msg');
const {
    getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson
} = require('./lib/functions');
const { File } = require('megajs');
const { commands, replyHandlers } = require('./command');

const app = express();
const port = process.env.PORT || 8000;

const prefix = '.';
const ownerNumber = ['94743404814'];
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

async function ensureSessionFile() {
    if (!fs.existsSync(credsPath)) {
        if (!config.SESSION_ID) {
            console.error('❌ SESSION_ID env variable is missing. Cannot restore session.');
            process.exit(1);
        }

        console.log("🔄 creds.json not found. Downloading session from MEGA...");

        const sessdata = config.SESSION_ID;
        const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

        filer.download((err, data) => {
            if (err) {
                console.error("❌ Failed to download session file from MEGA:", err);
                process.exit(1);
            }

            fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
            fs.writeFileSync(credsPath, data);
            console.log("✅ Session downloaded and saved. Restarting bot...");
            setTimeout(() => {
                connectToWA();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            connectToWA();
        }, 1000);
    }
}

async function connectToWA() {
    console.log("Connecting ZANTA-MD 🧬...");
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '/auth_info_baileys/'));
    const { version } = await fetchLatestBaileysVersion();

    const zanta = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Firefox"),
        auth: state,
        version,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
    });

    zanta.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWA();
            }
        } else if (connection === 'open') {
            console.log('✅ ZANTA-MD connected to WhatsApp');

            const up = `> ZANTA-MD connected ✅\n\nPREFIX: ${prefix}`;
            await zanta.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
                image: { url: `https://github.com/Akashkavindu/ZANTA_MD/blob/main/images/ChatGPT%20Image%20Nov%2021,%202025,%2001_21_32%20AM.png?raw=true` },
                caption: up
            });

            fs.readdirSync("./plugins/").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() === ".js") {
                    require(`./plugins/${plugin}`);
                }
            });
        }
    });

    zanta.ev.on('creds.update', saveCreds);

    zanta.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (msg.messageStubType === 68) {
                await zanta.sendMessageAck(msg.key);
            }
        }

        const mek = messages[0];
        if (!mek || !mek.message) return;

        mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message;
        if (mek.key.remoteJid === 'status@broadcast') return;

        const m = sms(zanta, mek);
        const type = getContentType(mek.message);
        const from = mek.key.remoteJid;
        const body = type === 'conversation' ? mek.message.conversation : mek.message[type]?.text || mek.message[type]?.caption || '';
        const isCmd = body.startsWith(prefix);
        const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const q = args.join(' ');

        const sender = mek.key.fromMe ? zanta.user.id : (mek.key.participant || mek.key.remoteJid);
        const senderNumber = sender.split('@')[0];
        const isGroup = from.endsWith('@g.us');
        const botNumber = zanta.user.id.split(':')[0];
        const pushname = mek.pushName || 'Sin Nombre';
        const isMe = botNumber.includes(senderNumber);
        const isOwner = ownerNumber.includes(senderNumber) || isMe;
        const botNumber2 = await jidNormalizedUser(zanta.user.id);

        const groupMetadata = isGroup ? await zanta.groupMetadata(from).catch(() => {}) : '';
        const groupName = isGroup ? groupMetadata.subject : '';
        const participants = isGroup ? groupMetadata.participants : '';
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

        const reply = (text) => zanta.sendMessage(from, { text }, { quoted: mek });

      // ╔═════════ ADDED REPLY MENU CHECK ═════════╗
        let replyToMenu = false;
        let replyNumber = null;

        if (!isCmd && mek.quoted) {
            let quotedMessage = '';
            const quotedMsg = mek.quoted.message;
            if (quotedMsg) {
                if (quotedMsg.extendedTextMessage) {
                    quotedMessage = quotedMsg.extendedTextMessage.text;
                } else if (quotedMsg.imageMessage) {
                    quotedMessage = quotedMsg.imageMessage.caption;
                } else if (quotedMsg.conversation) {
                    quotedMessage = quotedMsg.conversation;
                }
            }
            
            // 🚨 DEBUG: 1 - Bot එක Reply කළ Message එකේ Content එක කියවූවාද?
            console.log("DEBUG 1: Quoted Message Content:", quotedMessage ? quotedMessage.substring(0, 50) + "..." : "EMPTY");

            // 🚨 2. Magic Text Check (සරල කළ අනුවාදය)
            if (quotedMessage && quotedMessage.includes("menu option by replying")) {
                
                // 🚨 DEBUG: 2 - Magic Text Check එක සමත්ද?
                console.log("DEBUG 2: Magic Text Check PASSED!");

                const replyBody = body.trim(); 
                
                // 🚨 DEBUG: 3 - පරිශීලකයාගේ Reply එක කුමක්ද?
                console.log(`DEBUG 3: User Reply (Trimmed): '${replyBody}'`);
                
                // 🚨 4. Reply Number Check (අංක පමණක් තිබේදැයි පරීක්ෂා කිරීම)
                if (/^\d+$/.test(replyBody)) {
                    replyToMenu = true;
                    replyNumber = replyBody;
                    
                    // 🚨 DEBUG: 4 - අවසාන Check එක සමත්ද?
                    console.log("DEBUG 4: Final Digit Check PASSED! Running Menu.");
                } else {
                    console.log("DEBUG 4: Final Digit Check FAILED. (Not a pure digit reply)");
                }
            } else {
                console.log("DEBUG 2: Magic Text Check FAILED. (Not the Menu message)");
            }
        }
        // ╚═════════════════════════════════════════╝

        // ... (මෙහි පහළින් isCmd || replyToMenu block එක තිබිය යුතුයි) ...

        if (isCmd || replyToMenu) {
            
            // --- UPDATED LOGIC TO HANDLE MENU REPLY ---
            let commandToExecute = isCmd ? commandName : "menu"; 
            let queryArguments = isCmd ? q : replyNumber; 
            
            // 🚨 FINAL CRITICAL FIX: Update the 'm' object for the plugin to read
            if (replyToMenu) {
                m.q = replyNumber; 
            }
            // --- END UPDATED LOGIC ---
            
            const cmd = commands.find((c) => c.pattern === commandToExecute || (c.alias && c.alias.includes(commandToExecute)));
            if (cmd) {
                if (cmd.react) zanta.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                try {
                    cmd.function(zanta, mek, m, {
                        // Pass the arguments correctly, using queryArguments if it's a menu reply
                        from, quoted: mek, body, isCmd, command: commandToExecute, args: queryArguments ? [queryArguments] : args, q: queryArguments,
                        isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
                        isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
                        isBotAdmins, isAdmins, reply,
                    });
                } catch (e) {
                    console.error("[PLUGIN ERROR]", e);
                }
            }
        }

        const replyText = body;
        for (const handler of replyHandlers) {
            if (handler.filter(replyText, { sender, message: mek })) {
                try {
                    await handler.function(zanta, mek, m, {
                        from, quoted: mek, body: replyText, sender, reply,
                    });
                    break;
                } catch (e) {
                    console.log("Reply handler error:", e);
                }
            }
        }
    });
}

ensureSessionFile();

app.get("/", (req, res) => {
    res.send("Hey, ZANTA-MD started✅");
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
