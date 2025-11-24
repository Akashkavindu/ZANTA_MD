const { cmd } = require("../command");
// ඔබගේ functions.js වෙතින් sleep function එක නිවැරදිව ලබා ගනී
const { sleep } = require("../lib/functions"); 

// --- Core Helper: Animated Message Edit Function ---
async function sendAnimatedText(zanta, from, mek, messages, finalReact) {
    // 1. Initial Message එක යවන්න
    let initialMessage = await zanta.sendMessage(
        from, 
        { text: messages[0] }, 
        { quoted: mek }
    );
    
    const messageKey = initialMessage.key;

    // 2. Messages එකින් එක Edit කරන්න
    for (let i = 1; i < messages.length; i++) {
        const delay = i === 2 ? 1500 : 700; // සමහර Messages සඳහා වැඩි කාලයක් දෙන්න
        await sleep(delay); 
        
        // zanta.sendMessage(id, { text: 'text', edit: key }) මඟින් Message එක Edit කරයි
        await zanta.sendMessage(
            from,
            { text: messages[i], edit: messageKey }
        );
    }
    
    // 3. අවසාන Message එකට Reaction එකක් එකතු කරන්න 
    if (finalReact) {
        await zanta.sendMessage(from, { react: { text: finalReact, key: messageKey } });
    }
}


// 💖 LOVE Command
cmd(
  {
    pattern: "love",
    react: "💖",
    desc: "Sends an animated message with a loving theme.",
    category: "fun",
    filename: __filename,
  },
  async (zanta, mek, m, { from, reply, q }) => {
    try {
      const targetUser = q.trim() || m.pushName || "User";
      
      const messages = [
        `Typing... 💭`,
        `Thinking about ${targetUser}... ❤️`,
        `I love you! 💖`,
        `Always and forever. ✨`,
        `You are the best, ${targetUser}! 😊`
      ];

      await sendAnimatedText(zanta, from, mek, messages, "😘");
      
    } catch (e) {
      console.error("Love Command Error:", e);
      reply(`*Error:* Failed to perform the animated text. 😔`);
    }
  }
);

// 🔥 FIRE Command
cmd(
  {
    pattern: "fire",
    react: "🔥",
    desc: "Sends an animated message with an energetic/aggressive theme.",
    category: "fun",
    filename: __filename,
  },
  async (zanta, mek, m, { from, reply, q }) => {
    try {
      const targetMessage = q.trim() || "ZANTA-MD ON FIRE!";
      
      const messages = [
        `Initiating... 🧨`,
        `[WARNING] System Overload...`,
        `🚨 ${targetMessage} 🚨`,
        `🔥🔥🔥 DANGER! 🔥🔥🔥`,
        `🤯 Mission Accomplished! 💥`
      ];

      await sendAnimatedText(zanta, from, mek, messages, "😎");
      
    } catch (e) {
      console.error("Fire Command Error:", e);
      reply(`*Error:* Failed to perform the animated text. 😔`);
    }
  }
);
