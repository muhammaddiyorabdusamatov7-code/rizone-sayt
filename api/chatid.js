// Sozlash yordamchisi: bot qo'shilgan guruhlarning ID raqamini ko'rsatadi.
// TELEGRAM_CHAT_ID qo'yilgandan keyin bu sahifa o'chadi.
module.exports = async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).send('TELEGRAM_BOT_TOKEN hali qo\'yilmagan');
  if (process.env.TELEGRAM_CHAT_ID) return res.status(404).send('Sozlangan');
  const j = await fetch(`https://api.telegram.org/bot${token}/getUpdates`).then(r => r.json()).catch(() => ({}));
  const chats = {};
  for (const u of j.result || []) {
    const c = (u.message || u.my_chat_member || u.channel_post || {}).chat;
    if (c && c.type !== 'private') chats[c.id] = c.title;
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(Object.keys(chats).length ? Object.entries(chats).map(([id, t]) => `${t}: ${id}`).join('\n') : 'Guruh topilmadi. Botni guruhga qo\'shib, guruhga biror xabar yozing va sahifani yangilang.');
};
