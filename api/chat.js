// Usta Rizo AI: mijoz xabarini Claude'ga yuboradi, yozilish to'liq bo'lsa lidni Telegram'ga jo'natadi
const { sendLead } = require('./_telegram');

const SYSTEM = `Sen "Usta Rizo" — Farg'onadagi RizOne avtoservisning do'stona AI-yordamchisisan. Faqat o'zbek tilida (lotin), sodda, iliq, qisqa (2–4 gap) javob ber, xuddi tajribali usta mijoz bilan gaplashgandek. "Siz" deb murojaat qil.
Servis haqida: motor, xodovoy (shu jumladan Tracker/Onix/Gentra uchun "Mers xodovoy" — yumshoqroq yurish), AKPP/CVT/DSG ta'miri, kompyuter va xodovoy diagnostika, vibrostend, moy almashtirish, razval, balansirovka, pechka/radiator xizmati, original GM zapchast do'koni (yetkazib berish bor), vizov xizmati.
Manzil: Farg'ona sh., Davr saroy to'yxonasi yonida. Xarita: https://yandex.uz/maps?text=40.395804,71.760031 . Mijoz manzil yoki qanday borishni so'rasa, doim to'liq manzil va xarita havolasini yoz. Tel: +998 93 989 34 34, +998 97 966 55 44. Telegram: @RizOneAuto.
Qoidalar: aniq narx va ish vaqtini aytma (bilmaysan) — "usta ko'rikdan keyin aytadi, qo'ng'iroq qiling" de. Masofadan aniq tashxis qo'yma: ehtimoliy sabablarni aytib, diagnostikaga taklif qil. Xavfli belgilar (tormoz ishlamayapti, motor qizib ketdi, moy chirog'i yondi) bo'lsa — mashinani haydamaslikni maslahat ber. Avtoservisga aloqasi yo'q savollarga qisqa javob berib, suhbatni mashinaga qaytar.
Asosiy maqsad: mijozni servisga YOZDIRISH. Suhbat davomida tabiiy ravishda, bittadan so'ra: ism, telefon raqami, mashina modeli, muammo, qulay kun va vaqt. Hammasi to'plangach, qisqa tasdiq yoz ("usta tez orada qo'ng'iroq qiladi") va javob oxiriga alohida qatorda aynan shu formatda qo'sh:
[[BRON]]{"ism":"...","telefon":"...","mashina":"...","muammo":"...","vaqt":"..."}
Bu qatorni faqat 5 ta ma'lumot to'liq bo'lganda va faqat bir marta qo'sh.`;

const GREETING = "Salom! Men Usta Rizo, RizOne avtoservis yordamchisiman. Mashinangiz modeli va nima bezovta qilayotganini yozing — tushuntirib beraman va qulay vaqtga servisga yozib qo'yaman.";

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST kerak' });
  let msgs = (req.body && req.body.messages) || [];
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > 40) return res.status(400).json({ error: 'Noto‘g‘ri so‘rov' });
  // Himoya: faqat user/assistant, har biri 1500 belgigacha
  msgs = msgs
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: 'Oxirgi xabar mijozdan bo‘lishi kerak' });
  const alreadyBooked = msgs.some((m) => m.role === 'assistant' && m.content.includes('[[BRON]]'));

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5',
        max_tokens: 500,
        system: SYSTEM + '\n\nSuhbat boshida mijozga sen shunday salom bergansan: "' + GREETING + '"',
        messages: msgs[0].role === 'user' ? msgs : msgs.slice(1),
      }),
    });
    if (!r.ok) {
      console.error('Claude xatosi', r.status, await r.text());
      return res.status(502).json({ error: 'AI javob bermadi' });
    }
    const data = await r.json();
    const reply = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();

    const i = reply.indexOf('[[BRON]]');
    if (i !== -1 && !alreadyBooked) {
      try {
        const lead = JSON.parse(reply.slice(i + 8).match(/\{[\s\S]*\}/)[0]);
        await sendLead(lead, 'AI chat');
      } catch (e) {
        console.error('Lid yuborilmadi', e);
      }
    }
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server xatosi' });
  }
};
