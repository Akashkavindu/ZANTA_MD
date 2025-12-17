function getAliveMessage() {
    const date = new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return `*{BOT_NAME} 𝐈𝐒 𝐎𝐍𝐋𝐈𝐍𝐄 💞*

*╭────♡◉◉◉♡────⌬*
💖 *Hey...I’m {BOT_NAME}🙃, your lovely assistant — alive and sparkling now!*
*╰────♡◉◉◉♡────⌬*

*📅 Date: ${date}*
*⌚ Time: ${time}*
*───────────────*

*📱 Number: {OWNER_NUMBER}*
*💬 Prefix: {PREFIX}*
*───────────────*
*🌐 Contact Zanta*
> http://wa.me/+94743404814?text=*Hey__ZANTA*

> *© ZANTA-MD WA BOT*`;
}

module.exports = { getAliveMessage };
