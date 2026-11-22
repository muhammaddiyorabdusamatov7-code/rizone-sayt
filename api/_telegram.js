// Lidni Telegram guruhga yuborish (bot tokeni va chat_id Vercel sozlamalarida turadi)
const esc = (s) => String(s || '—').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])).slice(0, 300);

async function sendLead(lead, source) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram sozlanmagan');
  const text =
    `🔔 <b>YANGI LID — saytdan</b>${source ? ' (' + esc(source) + ')' : ''}\n\n` +
    `👤 Ism: ${esc(lead.ism)}\n` +
    `📞 Tel: ${esc(lead.telefon)}\n` +
    `🚗 Mashina: ${esc(lead.mashina)}\n` +
    `🔧 Muammo: ${esc(lead.muammo)}\n` +
    `🕐 Qulay vaqt: ${esc(lead.vaqt)}\n\n` +
    `📅 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!r.ok) throw new Error('Telegram xatosi: ' + (await r.text()));
}

module.exports = { sendLead };
