// Zaxira: AI ishlamay qolganda oddiy so'rovnoma orqali to'plangan lidni Telegram'ga yuboradi
const { sendLead } = require('./_telegram');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST kerak' });
  const b = req.body || {};
  if (!b.telefon || String(b.telefon).replace(/\D/g, '').length < 7) return res.status(400).json({ error: 'Telefon raqami kerak' });
  try {
    await sendLead(b, 'oddiy forma');
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Yuborilmadi' });
  }
};
