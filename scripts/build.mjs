// vfs-mockup-worker · Premium v3.5 Cloud-Builder
// GitHub Actions Runtime · Node 20+ ESM
// Triggered via workflow_dispatch oder repository_dispatch mit mockup_id

import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import { createHash } from 'node:crypto';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);

const {
  MOCKUP_ID,
  ANTHROPIC_API_KEY,
  NETLIFY_TOKEN,
  NETLIFY_PREVIEW_SITE_ID = '78324fe7-6075-4d03-8a8b-8500efc2ade0',
  INSTANTLY_API_KEY,
  VFS_SUPABASE_URL = 'https://kvtmkabkmouzljhsxgir.supabase.co',
  VFS_SUPABASE_SERVICE_KEY,
  CLOUDINARY_CLOUD_NAME = 'dlitscucm',
  SLACK_ALERTS_WEBHOOK,
} = process.env;

if (!MOCKUP_ID) throw new Error('MOCKUP_ID env required');

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

let inputTokensTotal = 0, outputTokensTotal = 0;

// === BUILD V2 PATCH A: Multi-Step Quality-Pipeline ===
let webSearchCalls = 0;

async function llmWithSearch(system, userPrompt, maxIterations) {
  maxIterations = maxIterations || 8;
  const tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxIterations }];
  let messages = [{ role: 'user', content: userPrompt }];
  let iter = 0;
  let lastText = '';
  while (iter < maxIterations + 2) {
    const res = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, system, messages, tools });
    inputTokensTotal += res.usage.input_tokens;
    outputTokensTotal += res.usage.output_tokens;
    for (const b of res.content) if (b.type === 'server_tool_use' && b.name === 'web_search') webSearchCalls++;
    const tb = res.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
    if (tb) lastText = tb;
    if (res.stop_reason === 'end_turn' || res.stop_reason === 'stop_sequence') return lastText;
    messages.push({ role: 'assistant', content: res.content });
    if (res.stop_reason !== 'pause_turn' && res.stop_reason !== 'tool_use') break;
    iter++;
  }
  return lastText;
}

async function step1_cluster(record, scrape) {
  const sys = 'Du bist Branchen- und Webdesign-Experte. Bestimme Cluster + Signature-Effekt fuer einen Schweizer KMU.\nCLUSTER: A Editorial/Atelier (Architekt,Galerie,Designstudio) | B Hospitality (Hotel,Restaurant,Cafe) | C Premium-Brand (Manufaktur,Mode,Schmuck) | D Beratung (Coaching,Anwalt,Treuhand) | E Medizin/Wellness (Praxis,Spa,Yoga,Physio) | F Lokales KMU (Coiffeur,Handwerk,Fitness) | G Tech/Digital\nSIGNATURE-EFFEKT (genau einer): 1 Splat (Three.js gsplat - Architektur,Hotel,Atelier) | 2 WebGL-Distortion (Curtains.js - Premium-Brand,Galerie,Designstudio) | 3 Variable-Font Reveal (Recursive - Editorial,Coaching,Verlag) | 4 Mesh-Gradient + Letter-Reveal (Whatamesh+Splitting - Concept-Brand,Tech-Boutique,Beratung) | 5 Theatre.js-Scroll (Hotel,Erlebnismarken,Storytelling)\nOutput JSON nur: {"cluster":"E","cluster_name":"Medizin/Wellness","signature_effekt":3,"signature_name":"Variable-Font Reveal","editorial_hebung":"...","design_thesis":"max 25 Worte"}';
  const usr = 'Firma: ' + (record.company || '') + '\nBranche: ' + (record.branche || '') + '\nEmail: ' + record.email + '\nReply-Signal: ' + (record.signal || '') + '\nBestehende Site Title: ' + (scrape && scrape.title || '') + '\nHeadlines: ' + ((scrape && scrape.headlines || []).slice(0,3).join(' | '));
  const r = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 800, system: sys, messages: [{ role: 'user', content: usr }] });
  inputTokensTotal += r.usage.input_tokens; outputTokensTotal += r.usage.output_tokens;
  const txt = r.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  const mm = txt.match(/\{[\s\S]*\}/);
  if (!mm) throw new Error('step1: no JSON');
  return JSON.parse(mm[0]);
}

async function step2_inspiration(cluster) {
  const sys = 'Du bist Awwwards-Juror und Designresearcher. Recherchiere mit web_search Tool 5-8 Best-in-Class-Sites. Queries: "awwwards [branche] site of the day 2026", "[branche] editorial website award winning 2026". Direkte Besuche awwwards.com, fwa.com, cssdesignawards.com, siteinspire.com, godly.website, land-book.com. Plus 2-3 Lottie-Files. Plus Editorial-Typografie-Referenz. Am Ende JSON: {"best_in_class":[{"url":"","name":"","note":"","steal":""}],"fontshare_pairing":"primary + secondary","color_palette":{"primary":"#hex","accent":"#hex","dark":"#hex","light":"#hex","neutral":"#hex"},"lottie_files":["url1","url2"],"design_thesis_refined":"max 25 Worte"}.';
  const usr = 'Cluster: ' + cluster.cluster + ' (' + cluster.cluster_name + ')\nEditorial-Hebung: ' + cluster.editorial_hebung + '\nSignature-Effekt: ' + cluster.signature_name + '\nInitial Design-Thesis: ' + cluster.design_thesis + '\nRecherchiere 5-8 Best-in-Class + Fontshare-Pairing + erdige Color-Palette (Sage statt Gruen, Ochre statt Gelb, Bordeaux statt Rot, Anthrazit statt Schwarz, Off-White statt Weiss) + 2 Lottie-URLs.';
  const txt = await llmWithSearch(sys, usr, 8);
  const mt = txt.match(/\{[\s\S]*\}/);
  if (!mt) return { best_in_class: [], fontshare_pairing: 'cabinet-grotesk + satoshi', color_palette: { primary: '#152518', accent: '#5a9468', dark: '#0a1410', light: '#f2f7f3', neutral: '#c98e6a' }, lottie_files: [], design_thesis_refined: cluster.design_thesis };
  return JSON.parse(mt[0]);
}

async function step3_images(cluster, scrape, inspiration) {
  const sys = 'Liefere Image-Plan als JSON. Verwende Unsplash-Photo-IDs Format https://images.unsplash.com/photo-XXXXXX. JSON nur: {"hero_image":"url","section_images":["url",...x8],"team_avatars":["url",...x4]}';
  const usr = 'Branche: ' + cluster.cluster_name + '\nFirma: ' + ((scrape && scrape.title) || '') + '\nVorhandene Site-Images: ' + ((scrape && scrape.images || []).slice(0,3).join(' | ')) + '\nColor-Akzent: ' + (inspiration.color_palette && inspiration.color_palette.accent || '') + '\n1 Hero, 8 Section, 4 Team-Avatars. NUR JSON.';
  const r = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, system: sys, messages: [{ role: 'user', content: usr }] });
  inputTokensTotal += r.usage.input_tokens; outputTokensTotal += r.usage.output_tokens;
  const txt = r.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  const mi = txt.match(/\{[\s\S]*\}/);
  if (!mi) return { hero_image: (scrape && scrape.images && scrape.images[0]) || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', section_images: (scrape && scrape.images || []).slice(0,8), team_avatars: [] };
  return JSON.parse(mi[0]);
}

function stripCodeFence(s) {
  if (!s) return '';
  let t = String(s).trim();
  t = t.replace(/^```(?:[a-zA-Z]+)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  return t.trim();
}
// === END PATCH A HELPERS ===


// ─── Supabase Helpers ────────────────────────────────────────
async function sb(method, path, body) {
  const res = await fetch(`${VFS_SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: VFS_SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${VFS_SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'PATCH' ? 'return=minimal' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`SB ${method} ${path} ${res.status}: ${await res.text()}`);
  return method === 'PATCH' ? null : res.json();
}

async function patchPending(id, fields) {
  return sb('PATCH', `pending_previews?id=eq.${id}`, fields);
}

// ─── Anthropic Helper ────────────────────────────────────────
async function llm(model, system, user, maxTokens = 4000) {
  const res = await anthropic.messages.create({
    model, max_tokens: maxTokens, system,
    messages: [{ role: 'user', content: user }],
  });
  inputTokensTotal += res.usage.input_tokens;
  outputTokensTotal += res.usage.output_tokens;
  return res.content?.[0]?.text || '';
}

// ─── Code-Fence-Strip (LLM-Output Sanitization) ─────────────────
function stripCodeFence(s) {
  if (!s) return '';
  let t = String(s).trim();
  // Remove opening ```html or ``` (with optional language tag)
  t = t.replace(/^\`\`\`(?:[a-zA-Z]+)?\s*\n?/, '');
  // Remove closing ```
  t = t.replace(/\n?\s*\`\`\`\s*$/, '');
  return t.trim();
}

// ─── Slug ────────────────────────────────────────────────────
function slugify(s) {
  return (s || 'mockup').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// ─── Site-Scrape via Puppeteer ───────────────────────────────
async function scrapeProspect(url) {
  if (!url) return { title: '', description: '', images: [], textSnippets: [] };
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25_000 }).catch(() => {});
    const data = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
        .filter(i => i.src && !i.src.startsWith('data:') && i.naturalWidth > 200)
        .slice(0, 12)
        .map(i => i.src);
      const textSnippets = Array.from(document.querySelectorAll('h1, h2, h3, p'))
        .map(e => (e.innerText || '').trim()).filter(t => t.length > 20 && t.length < 400)
        .slice(0, 30);
      return {
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.content || '',
        images: imgs,
        textSnippets,
      };
    });
    return data;
  } catch (e) {
    return { title: '', description: '', images: [], textSnippets: [], error: String(e) };
  } finally {
    await browser.close();
  }
}

// ─── Cloudinary URL-Builder ──────────────────────────────────
function cld(url, w = 1600) {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/f_auto,q_auto,w_${w}/${encodeURIComponent(url)}`;
}

// ─── Netlify Deploy via Hash-Method ──────────────────────────
async function netlifyDeploy(slug, htmlMap) {
  const fileMap = {};
  for (const [path, content] of Object.entries(htmlMap)) {
    const hash = createHash('sha1').update(content).digest('hex');
    fileMap[`/${slug}/${path}`] = hash;
  }
  const init = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_PREVIEW_SITE_ID}/deploys`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${NETLIFY_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: fileMap, async: false }),
  });
  if (!init.ok) throw new Error(`Netlify init ${init.status}: ${await init.text()}`);
  const deploy = await init.json();
  for (const [path, content] of Object.entries(htmlMap)) {
    const fullPath = `/${slug}/${path}`;
    if (deploy.required?.includes(fileMap[fullPath])) {
      const put = await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files${fullPath}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${NETLIFY_TOKEN}`, 'Content-Type': 'application/octet-stream' },
        body: content,
      });
      if (!put.ok) console.warn(`PUT ${fullPath} ${put.status}`);
    }
  }
  return `https://vf-services-previews.netlify.app/${slug}/`;
}

// ─── Lighthouse CLI ──────────────────────────────────────────
async function runLighthouse(url) {
  try {
    const { stdout } = await exec('lighthouse', [
      url, '--only-categories=performance,accessibility,seo',
      '--output=json', '--quiet', '--chrome-flags=--headless --no-sandbox',
    ], { maxBuffer: 50 * 1024 * 1024, timeout: 180_000 });
    const lh = JSON.parse(stdout);
    return {
      performance: Math.round((lh.categories?.performance?.score || 0) * 100),
      accessibility: Math.round((lh.categories?.accessibility?.score || 0) * 100),
      seo: Math.round((lh.categories?.seo?.score || 0) * 100),
    };
  } catch (e) {
    console.warn('LH failed:', e.message);
    return { performance: null, accessibility: null, seo: null };
  }
}

// ─── 5 Persona-Passes ────────────────────────────────────────
async function runPasses(html, prospect) {
  const passes = {
    pass1_design: { sys: 'Du bist Senior Webdesigner. Bewerte Layout, Typografie, Hierarchie, Whitespace, Hero-Effekt. Score 0-20. JSON: {"score":n,"notes":"..."}', max: 20 },
    pass2_polish: { sys: 'Du bist Senior Webdesigner. Bewerte Polish, Mikrointeraktionen, Sticky-Nav, Buttons, Booking-Flow. Score 0-24. JSON: {"score":n,"notes":"..."}', max: 24 },
    pass3_marketing: { sys: 'Du bist Marketing-Profi. Bewerte Hero-Botschaft, CTA-Position, Trust-Signale, Reviews, FAQ. Score 0-28. JSON: {"score":n,"notes":"..."}', max: 28 },
    pass4_seo: { sys: 'Du bist SEO-Spezialist. Bewerte Title, Meta, OG-Tags, Schema.org, H-Hierarchie, Alt-Texte. Score 0-36. JSON: {"score":n,"notes":"..."}', max: 36 },
    pass5_ux: { sys: 'Du bist UX/Customer-Journey-Experte. Bewerte Logik, Skim-Pattern, Touch-First, Heuristiken. Score 0-34. JSON: {"score":n,"notes":"..."}', max: 34 },
  };
  const results = {};
  for (const [key, cfg] of Object.entries(passes)) {
    try {
      const txt = await llm('claude-haiku-4-5-20251001', cfg.sys, `HTML (Auszug):\n${html.slice(0, 8000)}\n\nProspect: ${prospect.company}`, 600);
      const m = txt.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : { score: 0, notes: 'parse-fail' };
      results[key] = `${parsed.score}/${cfg.max}`;
    } catch (e) {
      results[key] = `n/a (${e.message?.slice(0, 50)})`;
    }
  }
  return results;
}

// ─── Instantly Reply ─────────────────────────────────────────
async function sendInstantlyReply(threadId, body, subject, mailCc) {
  if (!INSTANTLY_API_KEY || !threadId) return { sent: false, reason: 'no_key_or_thread' };
  const list = await fetch(`https://api.instantly.ai/api/v2/emails?search=thread:${threadId}&limit=5`, {
    headers: { Authorization: `Bearer ${INSTANTLY_API_KEY}` },
  });
  if (!list.ok) return { sent: false, reason: `list_${list.status}` };
  const data = await list.json();
  const last = (data.items || []).find(e => e.email_type === 'received');
  if (!last) return { sent: false, reason: 'no_received_email' };
  const reply = await fetch('https://api.instantly.ai/api/v2/unibox/reply', {
    method: 'POST',
    headers: { Authorization: `Bearer ${INSTANTLY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reply_to_uuid: last.id,
      eaccount: last.to_address_email,
      cc_address_email_list: mailCc || 'valentin.fischer@vf-services.ch',
      subject: subject || `Re: ${last.subject || 'Ihre Anfrage'}`,
      body, body_html: body,
    }),
  });
  return { sent: reply.ok, status: reply.status };
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] Build-Start mockup_id=${MOCKUP_ID}`);

  const recs = await sb('GET', `pending_previews?id=eq.${MOCKUP_ID}&select=*`);
  if (!recs?.[0]) throw new Error('Record not found');
  const m = recs[0];
  if (m.processed) { console.log('Already processed, skip.'); return; }

  await patchPending(MOCKUP_ID, { build_status: 'building', lifecycle_stage: 'building' });

  // Lookup Lead-Daten via Instantly oder Supabase leads
  let prospectUrl = '';
  let leadData = {};
  try {
    const list = await fetch(`https://api.instantly.ai/api/v2/leads/list`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${INSTANTLY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: `email = '${m.email}'`, limit: 1 }),
    });
    if (list.ok) {
      const d = await list.json();
      leadData = d.items?.[0] || {};
      prospectUrl = leadData.website || leadData.payload?.website || `https://${m.email.split('@')[1]}`;
    }
  } catch (_e) {}
  if (!prospectUrl) prospectUrl = `https://${m.email.split('@')[1]}`;

  const company = m.company || leadData.company_name || m.email.split('@')[0];
  const branche = m.branche || 'Dienstleistung';
  const firstName = m.first_name || leadData.first_name || '';
  const slug = slugify(`${branche}-${company}`);

  // Scrape
  console.log(`Scrape ${prospectUrl}`);
  const scrape = await scrapeProspect(prospectUrl);

  // === BUILD V2 PATCH A: Multi-Step Pipeline ===
  console.log('STEP 1 Cluster');
  const cluster = await step1_cluster(m, scrape);
  console.log('  Cluster: ' + cluster.cluster + '/' + cluster.cluster_name + ' | Sig: ' + cluster.signature_name);

  console.log('STEP 2 Inspiration with web_search');
  const inspiration = await step2_inspiration(cluster);
  console.log('  Refs: ' + (inspiration.best_in_class || []).length + ' | web_search_calls=' + webSearchCalls);

  console.log('STEP 3 Image-Curation');
  const curated = await step3_images(cluster, scrape, inspiration);
  curated.hero_image = cld(curated.hero_image, 2400);
  curated.section_images = (curated.section_images || []).map(u => cld(u, 1600));
  curated.team_avatars = (curated.team_avatars || []).map(u => cld(u, 600));
  // === END MULTI-STEP ===

  // Image-Cloudinary-Wrap
  const imgs = (scrape.images || []).slice(0, 8).map(u => cld(u, 1600));

  // HTML-Generation via Sonnet 4.6 mit v3.5-Prinzipien
  const sys = `Du baust einen Premium-Website-Mockup auf Awwwards-SOTM-Niveau fuer ein Schweizer KMU.

PFLICHT-REGELN: Schweizer Hochdeutsch (ss statt sz), Sie-Form, KEIN Pricing, KEIN Fake-Content, keine Em-Dashes, keine Floskeln. Cluster ${cluster.cluster_name}.

DESIGN-STANDARDS:
- Mind. 2 Fonts via Fontshare (Editorial-Display + Body) - siehe Pairing unten
- H1 clamp(3.5rem,9vw,7rem), letter-spacing -0.025em
- Body 17-18px line-height 1.5-1.6
- Eyebrow 0.15-0.2em uppercase tracking
- Color-Palette: primary/accent erdig/dark/light/neutral - siehe unten
- Mind. 1 Dark-Section pro Seite
- White-Space mutig (120px section-padding desktop, 80px mobile)
- Container max-width 1280-1440px
- Goldener Schnitt fuer 2-Column 1.618:1

LIBRARIES PFLICHT (CDN im Head):
- Lenis https://cdn.jsdelivr.net/npm/lenis@1.0.42/dist/lenis.min.js
- Motion One https://cdn.jsdelivr.net/npm/motion@10.18.0/dist/motion.umd.js
- Splitting.js https://unpkg.com/splitting@1.0.6/dist/splitting.min.js
- Lottie-web https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js
- Fontshare https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&f[]=satoshi@400,500,700&f[]=erode@400,500,700&f[]=clash-display@500,700&display=swap

SIGNATURE-EFFEKT (NUR der vorgegebene): ${cluster.signature_name} - implementiere mit zugehoeriger Library (1 Splat:Three.js+gsplat | 2 WebGL:Curtains.js | 3 Variable-Font:Recursive | 4 Mesh:Whatamesh | 5 Theatre:theatre/core).

PFLICHT-SECTIONS in dieser Reihenfolge:
1 nav sticky (Logo + Links + CTA + Hamburger Mobile)
2 #hero mit Signature-Effekt + H1 + Sub + 2 CTAs + Stats
3 #trust mit Cert-Badges branchenspezifisch (Krankenkassen, Physioswiss, EMR, ESTI, SBV) + Number-Cards
4 #ueber-uns Story/Person mit Foto + 3 Werte
5 #leistungen Service-Cards 3-spaltig mit Bild + Tag + Liste, KEIN Pricing
6 #booking 3-Step Interactive State-Machine (Service -> Stylist -> Slot, Live-Summary, Confirm-Button erst aktiv wenn alle 3 gewaehlt)
7 #team 3-4 Cards Foto 3:4 + Name + Rolle + Specialty
8 #reviews mind. 6 Testimonials + 5-Sterne + Avatar + Aggregate-Score
9 #standort 2-Column: Adresse/OEV/Auto/Tel/Mail/Oeffnungszeiten + Google Maps iframe
10 #faq 5+ Fragen Akkordion branchenspezifisch
11 #cta + Sticky Mobile CTA bottom-fixed
12 footer (Adresse, Oeffnung, Rechtliches)

GOOGLE MAPS PFLICHT: <iframe src="https://maps.google.com/maps?q=ADRESSE&t=&z=16&ie=UTF8&iwloc=&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:100%;border:0"></iframe>

CHATBOT-WIDGET PFLICHT: Floating-Button bottom-right 60x60 (Primary-Color, Chat-Icon, dezent pulse). Panel bei Klick 380x520 (weiss, Editorial-shadow, slide-up). Header "Chat mit [Brand]" + "Demo - 24/7 vf-services". 4 Chip-Fragen branchenrelevant. Bei Klick: Bot-Message mit 3-Dot-Typing-Indicator (800ms).

JS-PFLICHT: data-reveal Fallback-Timer 1500ms | Sticky-Nav scroll-shrink onScroll | Magnetic-Button-Hover .btn-magnetic | Lenis Smooth-Scroll init | Splitting() init fuer data-splitting | prefers-reduced-motion respektieren.

FORBIDDEN-WORDS: Game-Changer, innovativ, Marktfuehrer, revolutionaer, spannend, toll, super, klasse, Synergien, ganzheitlich (max 1x), nahtlos, state-of-the-art, world-class, Loesung, Mehrwert, Tradition trifft Moderne, Leidenschaft, Excellence.
Schweizer Hochdeutsch, ss statt sz, Sie-Form, keine Em-Dashes.
Stil-Cluster ableiten aus Branche. Signature-Effekt: 1 von 5 (Splat/WebGL/VariableFont/MeshGradient/Theatre).
Pflicht-Sections: Hero, Trust, Service-Cards (3, je 1 Bild), Galerie (4-8 Prospect-Bilder Masonry), Booking-Flow (3-Step), Reviews, Maps, FAQ (5+), Footer.
Mindestens 10 sichtbare Bilder. Cloudinary-URLs pflicht.
KEIN Pricing sichtbar.
Tracking-Pixel vor </body>: <img src="${VFS_SUPABASE_URL}/functions/v1/mockup-tracker?m=${MOCKUP_ID}&e=view" width=1 height=1 style="position:absolute;left:-9999px;">
Output: NUR komplettes HTML ab <!DOCTYPE html>. Keine Erklaerungen.`;
  const usr = `Firma: ${company}\nBranche: ${branche}\nStadt: aus Adresse ableiten\nProspect-URL: ${prospectUrl}\nReply-Signal: ${m.signal || ''}\n\nEditorial-Hebung: ${cluster.editorial_hebung}\nDesign-Thesis: ${inspiration.design_thesis_refined}\nSignature-Effekt: ${cluster.signature_effekt} ${cluster.signature_name}\n\nColor-Palette:\n${Object.entries(inspiration.color_palette || {}).map(([k,v]) => k + ': ' + v).join('\n')}\n\nFontshare-Pairing: ${inspiration.fontshare_pairing}\n\nBest-in-Class-Inspiration:\n${(inspiration.best_in_class || []).slice(0,5).map(b => '- ' + b.name + ': ' + b.steal).join('\n')}\n\nCurated Hero-Image: ${curated.hero_image}\nCurated Section-Images: ${(curated.section_images || []).slice(0,8).join(', ')}\nCurated Team-Avatars: ${(curated.team_avatars || []).join(', ')}\n\nGescrapte Daten:\nTitle: ${scrape.title}\nDesc: ${scrape.description}\nText-Snippets:\n${(scrape.textSnippets||[]).slice(0,12).join('\n')}`;
  const html = stripCodeFence(await llm('claude-sonnet-4-6', sys, usr, 24000));
  const finalHtml = html.startsWith('<!DOCTYPE') ? html : `<!DOCTYPE html>\n${html}`;

  // Seite 2 (vereinfachte Variante)
  const seite2Sys = `${sys}\nFuer Seite 2: branchen-spezifische Unterseite (Leistungen/Team/Portfolio). Selbe Navigation/Footer wie Home.`;
  const seite2 = stripCodeFence(await llm('claude-sonnet-4-6', seite2Sys, usr + '\n\nAufgabe: Seite 2.', 18000));
  const seite2Html = seite2.startsWith('<!DOCTYPE') ? seite2 : `<!DOCTYPE html>\n${seite2}`;

  // Deploy
  console.log(`Deploy slug=${slug}`);
  const previewUrl = await netlifyDeploy(slug, { 'index.html': finalHtml, 'seite2.html': seite2Html });
  await patchPending(MOCKUP_ID, { build_status: 'deployed', preview_url: previewUrl, preview_url_seite2: previewUrl + 'seite2.html' });

  // REDEPLOY_ONLY-Modus: nach Deploy abbrechen ohne Send (fuer Hot-Fix kaputter Mockups)
  if (m.build_status === 'redeploy_only') {
    console.log('REDEPLOY_ONLY mode: skip lighthouse/passes/mail/send');
    await patchPending(MOCKUP_ID, { build_status: 'redeployed', signal: 'redeploy_only_completed' });
    if (SLACK_ALERTS_WEBHOOK) {
      await fetch(SLACK_ALERTS_WEBHOOK, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: `:wrench: Redeploy-only fertig: ${previewUrl}` }) }).catch(()=>{});
    }
    return;
  }

  // Lighthouse
  console.log('Run Lighthouse');
  const lh = await runLighthouse(previewUrl);

  // 5 Persona-Passes
  console.log('Run 5 passes');
  const passes = await runPasses(finalHtml, { company });

  // Mail-Body
  const mailSys = `Schweizer Hochdeutsch ss statt sz, Sie-Form, keine Em-Dashes, keine Floskeln. Du schreibst eine kurze HTML-Mail (max 80 Worte) als Valentin Fischer von vf-services. Inhalt: kurzer konkreter Bezug auf Reply-Signal, Vorschau-Link einbetten, Calendly-Link <a href='https://calendly.com/valentin-fischer-vf-services/30min'>Termin vereinbaren</a> anbieten. Output: NUR HTML-Body, keine Subject, kein DOCTYPE.`;
  const mailUsr = `Firma: ${company}\nVorname: ${firstName}\nVorschau: ${previewUrl}\nSeite 2: ${previewUrl}seite2.html\nReply-Signal: ${m.signal || ''}`;
  const mailBody = stripCodeFence(await llm('claude-sonnet-4-6', mailSys, mailUsr, 600));
  const mailSubject = `Ihre Website als Vorschau, ${firstName || company}`;

  // Send Reply
  console.log('Send Instantly reply');
  const sendRes = await sendInstantlyReply(m.thread_id, mailBody, mailSubject, m.mail_cc || 'valentin.fischer@vf-services.ch');

  // Cost-Log
  const costChf = (inputTokensTotal * 3 + outputTokensTotal * 15) / 1_000_000 * 0.9;
  await sb('POST', 'cost_log', {
    agent_name: 'vfs_mockup_worker_github',
    model: 'claude-sonnet-4-6',
    input_tokens: inputTokensTotal,
    output_tokens: outputTokensTotal,
    cost_chf: Math.round(costChf * 1000) / 1000,
    reference_id: MOCKUP_ID,
  }).catch(e => console.warn('cost_log:', e.message));

  // Final PATCH
  const finalStatus = sendRes.sent ? 'sent' : 'deployed_send_failed';
  await patchPending(MOCKUP_ID, {
    processed: true,
    build_status: finalStatus,
    lifecycle_stage: sendRes.sent ? 'preview_sent' : 'deployed',
    branche_cluster: 'github-actions-premium',
    signature_effect: 'auto-selected',
    design_thesis: 'GitHub Actions Premium-Build mit Puppeteer-Scrape, Lighthouse, 5-Pass-Review.',
    mail_subject: mailSubject,
    mail_body: mailBody,
    prompt_version: 'cloud-premium-v1_2026-05-05',
    pass_scores: passes,
    lighthouse_performance: lh.performance,
    lighthouse_accessibility: lh.accessibility,
    lighthouse_seo: lh.seo,
    sent_at: sendRes.sent ? new Date().toISOString() : null,
    build_error: sendRes.sent ? null : `instantly: ${sendRes.reason || sendRes.status}`,
    signal: `cloud-premium-v1 deployed, send=${sendRes.sent}`,
  });

  // Slack-Success
  if (SLACK_ALERTS_WEBHOOK) {
    await fetch(SLACK_ALERTS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `:rocket: *Premium-Cloud-Build fertig*\nFirma: ${company}\nPreview: ${previewUrl}\nLH: P${lh.performance}/A${lh.accessibility}/S${lh.seo}\nMail: ${sendRes.sent ? 'sent' : 'FAIL ' + (sendRes.reason || sendRes.status)}\nKosten: ${costChf.toFixed(3)} CHF`,
      }),
    }).catch(() => {});
  }

  console.log(`Done. preview=${previewUrl} cost=${costChf.toFixed(3)} CHF`);
}

main().catch(async (e) => {
  console.error('FATAL:', e);
  await patchPending(MOCKUP_ID, {
    build_status: 'failed',
    build_error: `cloud_premium: ${String(e.message || e).slice(0, 500)}`,
  }).catch(() => {});
  if (SLACK_ALERTS_WEBHOOK) {
    await fetch(SLACK_ALERTS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `:x: Premium-Cloud-Build FAIL mockup_id=${MOCKUP_ID}: ${e.message}` }),
    }).catch(() => {});
  }
  process.exit(1);
});
