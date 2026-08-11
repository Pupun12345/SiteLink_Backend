const mongoose = require('mongoose');
const Post = require('../models/Post');
const Job = require('../models/Job');

// ═══════════════════════════════════════════════════════════════════
//  SHARE / DEEP LINK LANDING
// ═══════════════════════════════════════════════════════════════════
// App se share kiya gaya link `GET /p/:postId` pe aata hai. Ye route
// public hai (WhatsApp/Facebook ke crawler ke paas token nahi hota) aur
// do kaam karta hai:
//   1. OG meta tags — chat me link ka preview card banta hai
//   2. Smart redirect — app installed ho to app khule, warna store
//
// Yahan JSON nahi, HTML jaata hai. Post ka asli data app `GET
// /api/community/posts/:id` se leti hai (wo protected hai).

const ANDROID_PACKAGE =
  process.env.ANDROID_PACKAGE_NAME || 'com.sitelink.sitelink';
const APP_SCHEME = process.env.APP_SCHEME || 'sitelink';
const PLAY_STORE_URL =
  process.env.PLAY_STORE_URL ||
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const APP_STORE_URL = process.env.APP_STORE_URL || '';

/// HTML me daalne se pehle escape — post ka content user ka likha hua
/// hai, seedha chipkane se XSS ban jaata hai.
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/// JS string literal ke andar safe — quotes/backslash/newline se
/// script toot sakti hai.
function jsStr(str) {
  return JSON.stringify(String(str == null ? '' : str));
}

function truncate(str, max) {
  const s = String(str || '').replace(/\s+/g, ' ').trim();
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

function renderPage({ title, description, image, deepLink, webUrl }) {
  const storeUrl = PLAY_STORE_URL;
  // intent:// Android ka bhrosemand tareeka hai — app ho to khulti hai,
  // na ho to browser_fallback_url pe chala jaata hai. Iske liye domain
  // verification (assetlinks) ki zaroorat nahi padti.
  const intentUrl =
    `intent://${deepLink.host}${deepLink.path}#Intent;scheme=${APP_SCHEME};` +
    `package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(
      storeUrl
    )};end`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>

<!-- Link preview (WhatsApp, Facebook, Telegram, Slack) -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="SiteLink">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(webUrl)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}

<!-- iOS: app installed ho to Safari khud app kholne ki koshish karta hai -->
<meta name="apple-itunes-app" content="app-id=SITELINK_APP_ID">

<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
       background:#F5F7FA;color:#111827;display:flex;min-height:100vh;
       align-items:center;justify-content:center;padding:24px}
  .card{background:#fff;border-radius:16px;padding:28px 24px;max-width:420px;
        width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.08)}
  .logo{width:64px;height:64px;border-radius:50%;background:#F97316;color:#fff;
        display:flex;align-items:center;justify-content:center;margin:0 auto 16px;
        font-size:28px;font-weight:700}
  h1{font-size:18px;margin:0 0 8px}
  p{font-size:14px;color:#6B7280;margin:0 0 22px;line-height:1.5}
  a.btn{display:block;padding:14px;border-radius:10px;text-decoration:none;
        font-weight:600;font-size:15px}
  .primary{background:#F97316;color:#fff;margin-bottom:10px}
  .secondary{background:#F3F4F6;color:#374151}
</style>
</head>
<body>
  <div class="card">
    <div class="logo">S</div>
    <h1>${esc(title)}</h1>
    <p>${esc(description)}</p>
    <a class="btn primary" id="openApp" href="${esc(intentUrl)}">Open in SiteLink</a>
    <a class="btn secondary" href="${esc(storeUrl)}">Get the app</a>
  </div>

<script>
(function () {
  var scheme    = ${jsStr(`${APP_SCHEME}://${deepLink.host}${deepLink.path}`)};
  var intentUrl = ${jsStr(intentUrl)};
  var storeUrl  = ${jsStr(storeUrl)};
  var iosStore  = ${jsStr(APP_STORE_URL)};
  var ua = navigator.userAgent || '';
  var isAndroid = /android/i.test(ua);
  var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  // In-app browsers (WhatsApp/Instagram/FB) custom scheme aur intent:
  // dono block kar dete hain. Wahan auto-redirect karne se blank page
  // milta hai, isliye sirf button dikhate hain.
  var inAppBrowser = /(FBAN|FBAV|Instagram|Line|WhatsApp)/i.test(ua);
  if (inAppBrowser) return;

  if (isAndroid) {
    window.location.replace(intentUrl);
    return;
  }

  if (isIOS) {
    // iOS pe koi "app hai ya nahi" API nahi — scheme try karte hain,
    // page abhi bhi visible ho to matlab app nahi khuli.
    var t = setTimeout(function () {
      if (!document.hidden && iosStore) window.location.replace(iosStore);
    }, 1500);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(t);
    });
    window.location.replace(scheme);
  }
})();
</script>
</body>
</html>`;
}

/// Post aur Job dono ka landing page bilkul ek jaisa banta hai — sirf
/// "kya dikhana hai" alag hai. Wahi ek jagah rakh diya taaki kal koi
/// teesri cheez (worker profile?) share karni ho to sirf ek loader
/// likhna pade.
///
/// [loader] `{ title, description, image }` de ya `null` (mila hi nahi).
function makeSharePage({ pathPrefix, deepLinkHost, idParam, loader, fallbackDescription }) {
  return async (req, res) => {
    const id = req.params[idParam];
    const webUrl = `${req.protocol}://${req.get('host')}/${pathPrefix}/${id}`;
    const deepLink = { host: deepLinkHost, path: `/${id}` };

    // Cheez na mile / hata di gayi ho — page phir bhi bhejo (404 JSON
    // nahi), taaki user ko app/store ka raasta mile.
    const fallback = {
      title: 'SiteLink',
      description: fallbackDescription,
      image: null,
      deepLink,
      webUrl,
    };

    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).send(renderPage(fallback));
      }

      const meta = await loader(id);
      if (!meta) return res.status(404).send(renderPage(fallback));

      res
        .status(200)
        // Crawler ko fresh chahiye par har hit pe DB bhi nahi maarna —
        // 5 min ka cache theek hai.
        .set('Cache-Control', 'public, max-age=300')
        .send(renderPage({ ...meta, deepLink, webUrl }));
    } catch (err) {
      res.status(200).send(renderPage(fallback));
    }
  };
}

// @desc    Shared post ka landing page (preview + app me kholo)
// @route   GET /p/:postId
// @access  Public
exports.sharePostPage = makeSharePage({
  pathPrefix: 'p',
  deepLinkHost: 'post',
  idParam: 'postId',
  fallbackDescription:
    'Construction workers aur contractors ko jodne wala app.',
  loader: async (id) => {
    const post = await Post.findOne({
      _id: id,
      isActive: true,
      approvalStatus: 'approved',
    })
      .select('content images posterName companyName posterDesignation')
      .lean();
    if (!post) return null;

    const by = [post.companyName, post.posterDesignation].find(
      (v) => v && v.trim()
    );
    return {
      title: by
        ? `${post.posterName} · ${truncate(by, 40)}`
        : String(post.posterName || 'SiteLink'),
      description:
        truncate(post.content, 160) || 'Dekhiye SiteLink community par.',
      image: (post.images && post.images[0]) || null,
    };
  },
});

// @desc    Shared job ka landing page. Vendor apni job share karta hai
//          (log apply karein) aur worker doosron ko bhejta hai — dono
//          ka link yahi hai.
// @route   GET /j/:jobId
// @access  Public
exports.shareJobPage = makeSharePage({
  pathPrefix: 'j',
  deepLinkHost: 'job',
  idParam: 'jobId',
  fallbackDescription: 'SiteLink par construction jobs dhoondhiye.',
  loader: async (id) => {
    // Sirf live jobs — closed/pending job ka public preview banane ka
    // matlab nahi, aur na hi uska data bahar jaana chahiye.
    const job = await Job.findOne({
      _id: id,
      isActive: true,
      approvalStatus: 'approved',
    })
      .select('title company location salary salaryType description isUrgent')
      .lean();
    if (!job) return null;

    // "₹800/day · Andheri, Mumbai" — preview me sabse kaam ki do baatein
    const bits = [];
    if (job.salary) bits.push(`₹${job.salary}/${job.salaryType || 'day'}`);
    if (job.location) bits.push(truncate(job.location, 40));

    return {
      title: [
        job.isUrgent ? '🔴 Urgent' : null,
        truncate(job.title, 60),
        job.company ? `· ${truncate(job.company, 30)}` : null,
      ]
        .filter(Boolean)
        .join(' '),
      description:
        [bits.join(' · '), truncate(job.description, 120)]
          .filter((s) => s && s.length)
          .join(' — ') || 'SiteLink par ye job dekhiye.',
      // Jobs me image nahi hoti — preview me app ka logo hi theek hai.
      image: process.env.SHARE_FALLBACK_IMAGE || null,
    };
  },
});

// @desc    Android App Links verification file. Abhi backend plain-HTTP
//          IP par hai isliye Android ise verify nahi karega — par jaise
//          hi asli https domain lagega, sirf SHA256 env bharna hoga aur
//          manifest me autoVerify on karna hoga.
// @route   GET /.well-known/assetlinks.json
// @access  Public
exports.assetLinks = (req, res) => {
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  res.set('Content-Type', 'application/json').json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
};
