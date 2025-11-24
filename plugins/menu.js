const { cmd, commands } = require("../command");

// 🖼️ MENU Image URL එක (පෙර තිබූ පරිදිම)
const MENU_IMAGE_URL = "https://github.com/Akashkavindu/ZANTA_MD/blob/main/images/ChatGPT%20Image%20Nov%2021,%202025,%2001_49_53%20AM.png?raw=true";

cmd(
    {
        pattern: "menu",
        react: "📜",
        desc: "Displays all available commands, categorized.",
        category: "main",
        filename: __filename,
    },
    async (
        zanta,
        mek,
        m,
        {
            from,
            reply
        }
    ) => {
        try {
            const categories = {};

            // 1. Commands, Category අනුව වෙන් කිරීම
            for (let cmdName in commands) {
                const cmdData = commands[cmdName];
                const cat = cmdData.category?.toLowerCase() || "other";
                
                // .menu command එක menu එකේ පෙන්වන්නට අවශ්‍ය නැතිනම්, මෙසේ එය මග හරින්න:
                if (cmdData.pattern === "menu") continue; 
                
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({
                    pattern: cmdData.pattern,
                    desc: cmdData.desc || "No description"
                });
            }

            // 2. Custom Formatted Header එක
            let menuText = "╭━─━─━─━─━─━─━─━─━╮\n";
            menuText += "┃ 👑 *𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐙𝐀𝐍𝐓𝐀-𝐌𝐃* 🤖\n";
            menuText += "┃   _All Available Commands_\n";
            menuText += "╰━─━─━─━─━─━─━─━─━╯\n\n";

            // 3. Category සහ Commands එකතු කිරීම
            // 3. Category සහ Commands එකතු කිරීම (මෙම කොටස වෙනස් කළ පසු)
for (const [cat, cmds] of Object.entries(categories)) {
    
    const formattedCat = cat.charAt(0).toUpperCase() + cat.slice(1);
    
    // 1. Category Header (වෙන්කරනය)
    menuText += `\n\n*══════ [ 📚 ${formattedCat.toUpperCase()} ] ══════*\n\n`;
    
    // 2. Commands එකතු කිරීම (නව Box Style එක)
    cmds.forEach(c => {
        menuText += `╭──────●●►\n│⛩ Command ☛ .${c.pattern}\n│🏮 Use ☛ ${c.desc}\n╰──────●●►\n`;
    });
}

            // 4. Footer එක
            menuText += "\n\n➖➖➖➖➖➖➖➖➖➖➖➖➖\n";
            menuText += "> © 𝟐𝟎𝟐𝟓 | 𝐀𝐤𝐚𝐬𝐡 𝐊𝐚𝐯𝐢𝐧𝐝𝐮\n"; 
            
            // SEND IMAGE + MENU TEXT IN ONE MESSAGE
            await zanta.sendMessage(
                from,
                {
                    image: { url: MENU_IMAGE_URL },
                    caption: menuText.trim(),
                },
                { quoted: mek }
            );

        } catch (err) {
            console.error(err);
            reply("❌ Error generating menu.");
        }
    }
);




