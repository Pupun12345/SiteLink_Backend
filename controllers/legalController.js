const LegalPolicy = require('../models/LegalPolicy')
const PlatformSettings = require('../models/PlatformSettings')
const { hasActiveSubscription, subscriptionRequired } = require('../utils/subscription')


// Admin poora document seedha paste karta hai (Word/WhatsApp se) — markdown
// nahi likhta. App markdown render karti hai, isliye yahan headings pehchaan
// ke markdown bana dete hain, taaki HAR app version (purana bhi) me headings
// bold dikhein aur admin ke box me text saada hi rahe:
//   pehli line / "*TITLE*"      → #   (document title)
//   "1. Introduction"           → ##  (section)
//   "7.1 Benefit Provided…"     → ### (sub-section)
//   "A. Death While…"           → **bold**
//   chhoti line jo ':' par khatam → **bold**
// Content me pehle se markdown heading (#) ho to waisa hi bhejte hain.
function formatPolicyContent(raw) {
  const text = String(raw || '')
    // Purana data kabhi literal "\n" / "\"" ke saath save hua tha.
    .replace(/\\r\\n|\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  if (lines.some((l) => l.trimStart().startsWith('#'))) return text;

  const out = [];
  let first = true;
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;
    const starred = line.startsWith('*');
    line = line.replace(/^\*+|\*+$/g, '').trim();
    if (!line) continue;

    const short = line.length <= 90 && !line.endsWith('.');
    if (first && (starred || short)) out.push(`# ${line}`);
    else if (/^\d{1,2}\.\d{1,2}\.?\s+\S/.test(line) && short) out.push(`### ${line}`);
    else if (/^\d{1,2}\.\s+\S/.test(line) && short) out.push(`## ${line}`);
    else if ((/^[A-Z]\.\s+\S/.test(line) && short) || (line.endsWith(':') && line.length <= 60)) {
      out.push(`**${line}**`);
    } else out.push(line);
    first = false;
  }
  // Blank line beech me — warna markdown saari lines ek paragraph me jod deta.
  return out.join('\n\n');
}

// Get all policies — all versions of all types (Admin)
exports.getAllPolicies = async (req, res) => {
  try {
    // Public endpoint — sirf wahi fields bhejo jo app ko chahiye.
    // createdBy/lastUpdatedBy populate NAHI karte, warna admin ka
    // naam+email publicly expose ho jaata.
    const policies = await LegalPolicy.find({ isActive: true })
      .select('policyType title content version updatedAt')
      .sort({ policyType: 1, version: -1 })
      .lean();

    const data = policies.map((p) => ({ ...p, content: formatPolicyContent(p.content) }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching policies', error: error.message });
  }
};

// Get support contact info (app's "Contact Support" screen) — admin-managed,
// same PlatformSettings doc the admin panel edits under Platform Settings.
//
// Paid feature: sirf active plan wale users ko support ka contact milta
// hai (worker aur vendor dono). Admin hamesha allowed — warna support
// team apna hi contact nahi dekh paati.
exports.getSupportContact = async (req, res) => {
  try {
    if (req.user?.userType !== 'admin' && !hasActiveSubscription(req.user)) {
      return res.status(403).json(subscriptionRequired(
        'Contact Support is available on a paid plan. Please subscribe to a plan to reach our support team.'
      ));
    }

    const settings = await PlatformSettings.getOrCreateSettings();
    res.status(200).json({ success: true, data: settings.supportContact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching support contact', error: error.message });
  }
};
