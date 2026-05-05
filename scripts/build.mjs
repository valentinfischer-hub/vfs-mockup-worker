// vfs-mockup-worker Â· Premium v3.5 Cloud-Builder
// GitHub Actions Runtime Â· Node 20+ ESM
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

// âââ Supabase Helpers ââââââââââââââââââââââââââââââââââââââââ
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

// âââ Anthropic Helper ââââââââââââââââââââââââââââââââââââââââ
async function llm(model, system, user, maxTokens = 4000) {
  const res = await anthropic.messages.create({
    model, max_tokens: maxTokens, system,
    messages: [{ role: 'user', content: user }],
  });
  inputTokensTotal += res.usage.input_tokens;
  outputTokensTotal += res.usage.output_tokens;
  return res.content?.[0]?.text || '';
}

// âââ Slug ââââââââââââââââââââââââââââââââââââââââââââââââââââ
function slugify(s) {
  return (s || 'mockup').toLowerCase()
    .normalize('NFD').replace(/[Ì-Í¯]/g, '')
    .replace(/Ã¤/g, 'ae').replace(/Ã¶/g, 'oe').replace(/Ã¼/g, 'ue').replace(/Ã/g, 'ss')
    .replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// âââ Site-Scrape via Puppeteer âââââââââââââââââââââââââââââââ
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

// âââ Cloudinary URL-Builder ââââââââââââââââââââââââââââââââââ
function cld(url, w = 1600) {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/f_auto,q_auto,w_${w}/${encodeURIComponent(url)}`;
}

// âââ Netlify Deploy via Hash-Method ââââââââââââââââââââââââââ
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

// âââ Lighthouse CLI ââââââââââââââââââââââââââââââââââââââââââ
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

// âââ 5 Persona-Passes ââââââââââââââââââââââââââââââââââââââââ
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

// âââ Instantly Reply âââââââââââââââââââââââââââââââââââââââââ
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

// âââ Main ââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

  // Image-Cloudinary-Wrap
  const imgs = (scrape.images || []).slice(0, 8).map(u => cld(u, 1600));

  // HTML-Generation via Sonnet 4.6 mit v3.5-Prinzipien
  const sys = `Du baust einen Premium-Website-Mockup auf Awwwards-Niveau fuer ein Schweizer KMU.
Schweizer Hochdeutsch, ss statt sz, Sie-Form, keine Em-Dashes.
Stil-Cluster ableiten aus Branche. Signature-Effekt: 1 von 5 (Splat/WebGL/VariableFont/MeshGradient/Theatre).
Pflicht-Sections: Hero, Trust, Service-Cards (3, je 1 Bild), Galerie (4-8 Prospect-Bilder Masonry), Booking-Flow (3-Step), Reviews, Maps, FAQ (5+), Footer.
Mindestens 10 sichtbare Bilder. Cloudinary-URLs pflicht.
KEIN Pricing sichtbar.
Tracking-Pixel vor </body>: <img src="${VFS_SUPABASE_URL}/functions/v1/mockup-tracker?m=${MOCKUP_ID}&e=view" width=1 height=1 style="position:absolute;left:-9999px;">
Output: NUR komplettes HTML ab <!DOCTYPE html>. Keine Erklaerungen.`;
  const usr = `Firma: ${company}\nBranche: ${branche}\nStadt: aus Adresse ableiten\nProspect-URL: ${prospectUrl}\nReply-Signal: ${m.signal || ''}\n\nGescrapte Daten:\nTitle: ${scrape.title}\nDesc: ${scrape.description}\nImages (Cloudinary): ${imgs.join(', ')}\nText-Snippets:\n${(scrape.textSnippets||[]).slice(0,12).join('\n')}`;
  const html = await llm('claude-sonnet-4-6', sys, usr, 8000);
  const finalHtml = html.startsWith('<!DOCTYPE') ? html : `<!DOCTYPE html>\n${html}`;

  // Seite 2 (vereinfachte Variante)
  const seite2Sys = `${sys}\nFuer Seite 2: branchen-spezifische Unterseite (Leistungen/Team/Portfolio). Selbe Navigation/Footer wie Home.`;
  const seite2 = await llm('claude-sonnet-4-6', seite2Sys, usr + '\n\nAufgabe: Seite 2.', 6000);
  const seite2Html = seite2.startsWith('<!DOCTYPE') ? seite2 : `<!DOCTYPE html>\n${seite2}`;

  // Deploy
  console.log(`Deploy slug=${slug}`);
  const previewUrl = await netlifyDeploy(slug, { 'index.html': finalHtml, 'seite2.html': seite2Html });
  await patchPending(MOCKUP_ID, { build_status: 'deployed', preview_url: previewUrl, preview_url_seite2: previewUrl + 'seite2.html' });

  // Lighthouse
  console.log('Run Lighthouse');
  const lh = await runLighthouse(previewUrl);

  // 5 Persona-Passes
  console.log('Run 5 passes');
  const passes = await runPasses(finalHtml, { company });

  // Mail-Body
  const mailSys = `Schweizer Hochdeutsch ss statt sz, Sie-Form, keine Em-Dashes, keine Floskeln. Du schreibst eine kurze HTML-Mail (max 80 Worte) als Valentin Fischer von vf-services. Inhalt: kurzer konkreter Bezug auf Reply-Signal, Vorschau-Link einbetten, Calendly-Link <a href='https://calendly.com/valentin-fischer-vf-services/30min'>Termin vereinbaren</a> anbieten. Output: NUR HTML-Body, keine Subject, kein DOCTYPE.`;
  const mailUsr = `Firma: ${company}\nVorname: ${firstName}\nVorschau: ${previewUrl}\nSeite 2: ${previewUrl}seite2.html\nReply-Signal: ${m.signal || ''}`;
  const mailBody = await llm('claude-sonnet-4-6', mailSys, mailUsr, 600);
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
