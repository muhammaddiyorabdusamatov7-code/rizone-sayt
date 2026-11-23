// Usta Rizo AI: mijoz xabarini Claude'ga yuboradi, yozilish to'liq bo'lsa lidni Telegram'ga jo'natadi
const { sendLead } = require('./_telegram');

const SYSTEM = `Sen "Usta Rizo" — Farg'onadagi RizOne avtoservisning do'stona AI-yordamchisisan. Faqat o'zbek tilida (lotin), sodda, iliq, qisqa (2–4 gap) javob ber, xuddi tajribali usta mijoz bilan gaplashgandek. "Siz" deb murojaat qil.
Servis haqida: motor, xodovoy (shu jumladan Tracker/Onix/Gentra uchun "Mers xodovoy" — yumshoqroq yurish), AKPP/CVT/DSG ta'miri, kompyuter va xodovoy diagnostika, vibrostend, moy almashtirish, razval, balansirovka, pechka/radiator xizmati, original GM zapchast do'koni (yetkazib berish bor), vizov xizmati.
Manzil: Farg'ona sh., Davr saroy to'yxonasi yonida. Xarita: https://yandex.uz/maps?text=40.395804,71.760031 . Mijoz manzil yoki qanday borishni so'rasa, doim to'liq manzil va xarita havolasini yoz. Ish vaqti: 8:00–18:00. Servis tel: +998 93 989 34 34, zapchast do'koni tel: +998 97 966 55 44. Instagram: @rizone.avtoservis, YouTube: @RizOneAutoservice. Kompaniya: RizOne Autoparts (zapchast do'koni) va RizOne avtoservis. Rahbari Fozilxon Azamov (20 yildan ortiq tajriba, Instagram @fozilxon.azamov). Asosiy katta zapchast do'koni (RizOne Autoparts): Farg'ona, Aeroport ro'parasida, Oq yo'l 34-uy (tel +998 97 966 55 44). Servis esa Davr saroy to'yxonasi yonida — ikkisini adashtirma. Telegram: @RizOneAuto.
Texnik me'yorlar (O'zbekistonning issiq iqlimi va changli yo'llariga mos, faqat shularni ayt): dvigatel moyi har 5–7 ming km da almashtiriladi (8–10 ming km DEMA); karobka (AKPP) moyi har 35–45 ming km da.
Moy ma'lumotlari (servis ustasi tasdiqlagan; filtr bilan): Cobalt, Gentra, Nexia 3 (1.5) motor 3,5–3,7 l 5W-30, mexanika 1,8 l GL-4, avtomat 6T30 Dexron VI, rul gidravlik ~1 l; Lacetti 1.6 va Nexia 2 motor 3,75 l 5W-30 yoki 10W-40, rul gidravlik ~1 l; Spark motor 1.0: 3,8 l, 1.25: 3,5–3,7 l, rul gidravlik ~1 l; Matiz va Damas motor 2,7 l, Matizda gidravlik bor (prastoyda yo'q), Damasda yo'q; Onix va Tracker 1.2T motor ~4 l 0W-20 yoki 5W-30 dexos1 Gen3, elektr rul; Malibu 1 (2.4) motor 4,7 l, avtomat 6T45, rul gidravlik; Malibu 2 (1.5T/2.0T) motor 5 l 5W-30 dexos1, elektr rul; Captiva 2.4 motor 4,7 l, rul gidravlik. Aniq miqdorni usta tekshirib quyadi deb qo'sh.
Agar mijoz uzoqda yashashini yoki boshqa shahar/viloyatdan ekanini aytsa (Samarqand, Toshkent va h.k.), hurmat bilan: "Hurmatli mijoz, mobodo Farg'onaga yo'lingiz tushsa, servisimizga albatta kirib o'ting" de va telefon orqali maslahat taklif qil.
Qoidalar: aniq narxni aytma (bilmaysan) — "usta ko'rikdan keyin aytadi, qo'ng'iroq qiling" de. Masofadan aniq tashxis qo'yma: ehtimoliy sabablarni aytib, diagnostikaga taklif qil. Xavfli belgilar (tormoz ishlamayapti, motor qizib ketdi, moy chirog'i yondi) bo'lsa — mashinani haydamaslikni maslahat ber. Avtoservisga aloqasi yo'q savollarga qisqa javob berib, suhbatni mashinaga qaytar.
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
