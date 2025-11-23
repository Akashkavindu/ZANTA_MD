const { cmd } = require("../command");

cmd(
    {
        pattern: "save",
        react: "✅",
        desc: "Resend Status or One-Time View Media",
        category: "general",
        filename: __filename,
    },
    async (
        zanta,
        mek,
        m,
        {
            from,
            quoted,
            reply,
        }
    ) => {
        try {
            // 1. Check if the user replied to a message
            if (!quoted) {
                return reply("*කරුණාකර ඔබට save කර ගැනීමට අවශ්‍ය Media Message එකකට (Status, OTV, Photo/Video) reply කරන්න!* 🧐");
            }

            // 2. Identify the core media object and caption
            let mediaMessage = quoted.fakeObj;
            let saveCaption = "*💾 Saved and Resent!*";
            let recognized = false;

            // --- Status/OTV Check ---
            if (quoted.isStatus && mediaMessage) {
                saveCaption = "*✅ Saved and Resent from Status!*";
                recognized = true;
            } else if (quoted.isViewOnce && mediaMessage) {
                saveCaption = "*📸 Saved and Resent from One-Time View!*";
                recognized = true;
            } 
            
            // --- Regular Media Check (if not Status/OTV, check for any regular media) ---
            // If it's a regular chat media, quoted.fakeObj might also contain the data.
            const repliedMtype = quoted.mtype || quoted.fakeObj?.mtype; 
            
            if (!recognized && repliedMtype && mediaMessage) {
                // Check if it's any type of media message (image, video, audio, document)
                if (repliedMtype.includes('imageMessage') || 
                    repliedMtype.includes('videoMessage') || 
                    repliedMtype.includes('audioMessage') || 
                    repliedMtype.includes('documentMessage')) {
                    recognized = true;
                }
            }

            // 3. Final Check: Proceed only if media is recognized AND we have the data
            if (!recognized || !mediaMessage) {
                 // This error triggers if quoted.isStatus is true, but quoted.fakeObj is null (no media fetched)
                return reply("*⚠️ Media Content එක හඳුනාගැනීමට නොහැකි විය. Status එකකට reply කරනවා නම් එය photo/video එකක් බවට සහතික වන්න!*");
            }
            
            // 4. Copy and Forward the media
            await zanta.copyNForward(from, mediaMessage, {
                caption: saveCaption,
                quoted: mek // Quote the original 'save' message
            });

            return reply("*Media successfully processed and resent!* ✨");

        } catch (e) {
            console.error(e);
            reply(`*Error saving media:* ${e.message || e}`);
        }
    }
);
