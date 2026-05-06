// vfs-mockup-worker · Premium V35.1 Cloud-Builder (Sub-Profile-DNA + Hybrid-Image-Pool)
// GitHub Actions Runtime · Node 20+ ESM
// Triggered via workflow_dispatch oder repository_dispatch mit mockup_id
// V35 Changes (2026-05-06): Branche-Sub-Profile-Lookup, fixe Color-Palette pro Profil,
// Layout-DNA + Hero-Pattern + Voice + Image-Treatment fix, Pflicht-Code-Snippets
// fuer Signature-Effekte, 5 Pflicht-Layout-Muster (Asymm-Split, Sticky-Caption,
// Vertical-Eyebrow, Bento-Grid, Marquee), positive Sprach-Direktive, Story-Arc.
// V35.1 Changes (2026-05-06): 3-Tier-Image-Pool. AUTHENTIC (Prospect-Bilder mit
// Quality-Gate, Role-Tagging hero/gallery/team/generic, HEAD-Validation,
// Cloudinary-Wrap) > STOCK (Pexels) > AI (Replicate Flux-Schnell, optional via
// REPLICATE_API_TOKEN). Plus Logo-Extraction (og:image / Header-class / Favicon).
// Erweiterte scrapeProspect mit naturalWidth/Height + parent-context + alt-text.
// V35.2 Changes (2026-05-06): Lazy-Load-Trigger (slow-scroll bottom + scroll top),
// srcset-best-resolution + data-src/data-lazy-src Fallback, naturalWidth=0 toleriert
// mit URL-Hint-Inferenz (z.B. "1600x900" oder "_1200" im Path). Quality-Gate
// Threshold 800 -> 600 mit unknown-size Toleranz. Logo-Detection erweitert: SVG,
// apple-touch-icon, Markenname-Pattern, header-first-Fallback. REDEPLOY_ONLY
// patcht jetzt prompt_version+branche_cluster+signature_effect+design_thesis.

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
  NETLIFY_PREVIEW_SITE_ID = '0c9138f4-3d5a-4a8e-a8a4-bd0cd735d6f7',
  INSTANTLY_API_KEY,
  VFS_SUPABASE_URL = 'https://kvtmkabkmouzljhsxgir.supabase.co',
  VFS_SUPABASE_SERVICE_KEY,
  CLOUDINARY_CLOUD_NAME = 'dlitscucm',
  SLACK_ALERTS_WEBHOOK,
} = process.env;

// =====================================================================
// === V35 BRANCH-SUB-PROFILE-DNA (2026-05-06) ==========================
// =====================================================================
// Pro Branche: Color-Palette (5 hex), Layout-DNA, Image-Mood, Voice,
// Image-Treatment, Cert-Badges, Signature-Effekt, Fontshare-Pairing.
// Lookup via Regex-Map auf Branche-String. Cluster-Defaults als Fallback.
const BRANCH_PROFILES = {
  // ── Cluster E · Medizin/Wellness ────────────────────────────────────
  E1_physio: {
    cluster: 'E', cluster_name: 'Medizin/Wellness',
    signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#2d4a3a', accent: '#6b8e7f', dark: '#1a2820', light: '#f4f1ec', neutral: '#c9a48a' },
    layout_dna: 'Editorial-Magazin mit asymmetrischen 60/40-Splits, Sticky-Side-Caption mit vertikaler Eyebrow-Typo, Hero-Quote ueber Fullbleed-Body-Detail-Bild, Bento-Galerie 1 gross + 3 klein',
    image_mood: 'Bewegung in Stille, Haende-am-Patienten Detail Macro, neutrale Praxis-Raeume mit Pflanzen, koerperzentriert nicht klinisch, Therapeut-Blick fokussiert',
    voice: 'Persoenlich, praesent, anatomisch praezise, lokal verankert. Verben: zuhoeren, begleiten, loesen, aktivieren, lindern, mobilisieren',
    treatment: 'Duotone Sage ueber Body-Detail-Bilder mix-blend-mode multiply, Aspect 4:5 Hero, 16:9 Section, runde Edges 12px',
    badges: ['EMR', 'ASCA', 'Krankenkassen anerkannt', 'Physioswiss Mitglied'],
    hero_pattern: 'Stille-Verspechen-Quote im Editorial-Italic ueber Body-Macro-Bild, daneben kleines Stat-Cluster',
  },
  E2_kosmetik: {
    cluster: 'E', cluster_name: 'Medizin/Wellness',
    signature_effekt: 2, signature_name: 'WebGL-Distortion',
    fontshare_pairing: 'clash-display + cabinet-grotesk',
    palette: { primary: '#3d2a2a', accent: '#d4a896', dark: '#1c0f0f', light: '#faf3ef', neutral: '#e8c5b3' },
    layout_dna: 'Premium-Brand-Magazin mit Center-Stage-Hero, Bento-Grid-Leistungen, Marquee-Ribbon mit Treatment-Namen, Sticky-Booking-Bar bottom mobile',
    image_mood: 'Haende, Hautstruktur Macro, sanft erleuchtete Behandlungsraeume, Produktdetails, weibliche Rituale, Aesthetik nicht Cosmetic, warme Ueberbelichtung',
    voice: 'Sinnlich, kuratiert, ritualhaft, vertrauensvoll. Verben: spueren, ankommen, pflegen, regenerieren, beleben, ausgleichen',
    treatment: 'Soft-Sepia-Tint, Aspect 4:5 Portrait-Hero, runde Edges 24px, Grain-Overlay subtle',
    badges: ['BSC anerkannt', 'Bio-zertifiziert', '10+ Jahre Erfahrung', 'Premium-Marken'],
    hero_pattern: 'Center-Stage-Hero mit grosser Italic-Headline ueber Hand-Macro, Marquee-Ribbon mit Treatment-Namen direkt unter Hero',
  },
  E3_yoga: {
    cluster: 'E', cluster_name: 'Medizin/Wellness',
    signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#3a3528', accent: '#a89968', dark: '#1f1c14', light: '#faf6ec', neutral: '#d4c4a4' },
    layout_dna: 'Atmungs-Layout mit ueppigem Whitespace, vertikalen Section-Eyebrows, Hero ohne Bild nur Mesh-Gradient mit Letter-Reveal-Quote, Stundenplan-Tabelle als Editorial-Grid',
    image_mood: 'Asana-Silhouetten, Studio-Holz-Boden, Morgenlicht durchs Fenster, Atmen-Geste, Zen-Stille',
    voice: 'Ruhig, einladend, atemzentriert. Verben: atmen, ankommen, halten, oeffnen, balancieren',
    treatment: 'Sand-Tint mix-blend-mode soft-light, Aspect 1:1 oder 4:5 Portrait, max 60% Saturation',
    badges: ['Yoga Alliance', 'Yogalehrer-Verband Schweiz', 'Eingeweiht in der Tradition'],
    hero_pattern: 'Mesh-Gradient-Hero ohne Bild mit slow-letter-reveal Quote, Stundenplan-Preview direkt unten',
  },
  E4_zahnarzt: {
    cluster: 'E', cluster_name: 'Medizin/Wellness',
    signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'cabinet-grotesk + satoshi',
    palette: { primary: '#1f3a4a', accent: '#7ba8b8', dark: '#0d1d27', light: '#f4f8fa', neutral: '#c4d4dc' },
    layout_dna: 'Klar-strukturiert-Editorial mit asymmetrischer Hero (links Headline + Stats, rechts Fullbleed-Behandlungsraum), Behandlungs-Bento-Grid, Schritt-fuer-Schritt-Erstbesuch-Storyboard',
    image_mood: 'Moderne Praxis-Architektur, Behandlungsraum-Detail, Patient-laechelt-natuerlich, kein Werbe-Stock, technisch praezise',
    voice: 'Praezise, beruhigend, kompetent, transparent. Verben: erklaeren, schonen, erhalten, korrigieren, vorbeugen',
    treatment: 'Cool-Cyan-Tint subtle, Aspect 16:9 Section, runde Edges 8px, klare Linien',
    badges: ['SSO Mitglied', 'Schweizerische Zahnaerzte-Gesellschaft', 'Krankenkassen anerkannt', 'CEREC-zertifiziert'],
    hero_pattern: 'Asymm-Hero 55/45 mit grosser Headline links + Mesh-Gradient-Akzent + Stats, rechts Praxisraum-Bild',
  },
  // ── Cluster F · Lokales KMU ─────────────────────────────────────────
  F1_coiffeur: {
    cluster: 'F', cluster_name: 'Lokales KMU',
    signature_effekt: 2, signature_name: 'WebGL-Distortion',
    fontshare_pairing: 'clash-display + cabinet-grotesk',
    palette: { primary: '#2a2018', accent: '#b8956b', dark: '#15100b', light: '#f7f1e8', neutral: '#d4b896' },
    layout_dna: 'Atelier-Editorial mit Center-Stage-Hero, asymmetrischen 70/30 Service-Splits, Marquee-Ribbon mit Cuts, Sticky-Side-Caption "seit Jahr X"',
    image_mood: 'Kopf-Detail Macro, Schere-im-Spiegel, Hair-Texture, warmes Innenlicht, kein Werbe-Smile, Konzentration des Stylisten',
    voice: 'Lokal, ehrlich, handwerklich, mit Charakter. Verben: schneiden, formen, zuhoeren, beraten, anpassen',
    treatment: 'Warm-Sepia mix-blend-mode multiply, Aspect 4:5 Portrait, Grain-Overlay 8% opacity',
    badges: ['Schweizer Coiffeur-Verband', 'Davines-Partner', 'Bio-Coloration'],
    hero_pattern: 'Center-Stage Big-Italic-Headline ueber Hair-Macro mit WebGL-Distortion, Marquee unter Hero mit Cut-Names',
  },
  F2_garagist: {
    cluster: 'F', cluster_name: 'Lokales KMU',
    signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'cabinet-grotesk + satoshi',
    palette: { primary: '#1c2530', accent: '#d97742', dark: '#0c1118', light: '#f1f3f5', neutral: '#a8b4c0' },
    layout_dna: 'Industrial-Editorial mit asymmetrischen 60/40-Splits, Hero in Werkstatt-Halle, Stat-Bar mit km/Reparaturen, Service-Grid mit Icons + Werkstatt-Bildern',
    image_mood: 'Werkstatt-Boden, Werkzeug-Detail, Mechaniker-Hand-an-Motor, Werkstatt-Halle-Architektur, Auto-Detail-Macro',
    voice: 'Direkt, kompetent, vertrauensvoll, lokal. Verben: pruefen, reparieren, warten, beraten, garantieren',
    treatment: 'Cool-Steel-Tint, Aspect 16:9 Section, scharfe Edges 4px, hoher Kontrast',
    badges: ['AGVS Mitglied', 'TCS-empfohlen', 'Auto Schweiz qualifiziert', 'Marken-Servicepartner'],
    hero_pattern: 'Asymm-Hero 60/40 mit Werkstatt-Halle-Image + grosser Headline links, Stat-Bar bottom-Hero (Anzahl Marken / Jahre / Fahrzeuge)',
  },
  F3_maler: {
    cluster: 'F', cluster_name: 'Lokales KMU',
    signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#3a2818', accent: '#c98a4a', dark: '#1d130a', light: '#f8f1e8', neutral: '#d4b896' },
    layout_dna: 'Handwerk-Editorial mit Hero-Pinselstrich-Detail, Vorher-Nachher-Slider als Hauptmoment, Bento-Galerie ausgefuehrte Projekte, Material-Karte mit Hersteller-Logos',
    image_mood: 'Pinsel-Detail Macro, Wandtextur, Maler-am-Werk konzentriert, fertig-gestrichener-Raum mit Licht, Farbenfaecher',
    voice: 'Handwerklich, sorgfaeltig, lokal, zuverlaessig. Verben: streichen, vorbereiten, beraten, beschuetzen (Material), erneuern',
    treatment: 'Warm-Erdton-Tint, Aspect 3:4 Portrait fuer Werks-Bilder, 16:9 fuer Raeume',
    badges: ['Schweizer Maler-Verband', 'Sikkens-Partner', 'Biomineralisch zertifiziert'],
    hero_pattern: 'Hero mit Pinselstrich-Macro + Variable-Font-Reveal-Headline, Vorher-Nachher-Slider als Section 2',
  },
  F4_sanitaer: {
    cluster: 'F', cluster_name: 'Lokales KMU',
    signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'cabinet-grotesk + satoshi',
    palette: { primary: '#1c3038', accent: '#5a8b9c', dark: '#0c161b', light: '#f0f4f6', neutral: '#a8b8bf' },
    layout_dna: 'Klar-Editorial mit asymmetrischer Hero, 24/7-Notdienst-Eyebrow prominent, Service-Grid mit Bauteil-Bildern, Stundenplan-Erreichbarkeit als Tabelle',
    image_mood: 'Armatur-Detail Macro, Badezimmer-Architektur fertig, Sanitaer-am-Werk konzentriert, Werkzeug-Tasche',
    voice: 'Direkt, schnell-erreichbar, kompetent, lokal. Verben: reparieren, erneuern, warten, installieren, beheben',
    treatment: 'Cool-Steel-Tint subtle, Aspect 16:9 fuer Raeume, 1:1 fuer Werkzeug',
    badges: ['SuissePlumb', 'Suissetec Mitglied', '24/7 Notdienst', 'Garantie-Versprechen'],
    hero_pattern: 'Asymm-Hero 55/45, Notdienst-Eyebrow + Telefonnummer prominent in Hero, Stat-Bar mit Reaktionszeit',
  },
  F5_schreiner: {
    cluster: 'F', cluster_name: 'Lokales KMU',
    signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#3a2c1c', accent: '#a8804a', dark: '#1c150c', light: '#f7f0e4', neutral: '#d4b896' },
    layout_dna: 'Atelier-Editorial mit Holzmaserung-Hero, Werks-Galerie als Bento-Grid, Material-Story-Sticky-Side, Massanfertigungs-Prozess als Storyboard',
    image_mood: 'Holzmaserung Macro, Werkstatt mit Spaenen, Schreiner-Hand-am-Werkstueck, fertige Moebel im Raum, Holz-Detail',
    voice: 'Handwerklich, geduldig, mit Liebe zum Material, lokal. Verben: schreinern, formen, schleifen, anpassen, gestalten',
    treatment: 'Warm-Walnut-Tint, Aspect 3:4 Portrait fuer Werks-Detail, 16:9 fuer Raeume mit Moebel',
    badges: ['VSSM Schreiner-Verband', 'FSC-zertifiziertes Holz', 'Lehrbetrieb seit Jahr X'],
    hero_pattern: 'Hero mit Holzmaserung-Fullbleed + Variable-Font-Reveal-Headline ueber dem Holz, Werks-Bento direkt unten',
  },
  F6_optiker: {
    cluster: 'F', cluster_name: 'Lokales KMU',
    signature_effekt: 2, signature_name: 'WebGL-Distortion',
    fontshare_pairing: 'clash-display + cabinet-grotesk',
    palette: { primary: '#2a2530', accent: '#9c8b8b', dark: '#15101a', light: '#f5f3f7', neutral: '#c8c0c8' },
    layout_dna: 'Premium-Brand-Editorial mit Brillen-Macro-Hero, Marken-Marquee, Bento-Grid mit Brillen-Modellen, Service-Story (Sehtest, Beratung, Anpassung)',
    image_mood: 'Brille-Macro im Sonnenlicht, Geschaeft-Innenraum mit Brillen-Wand, Optiker-mit-Kunde in Beratung, Augenuntersuchung',
    voice: 'Praezise, beratend, stilsicher, lokal. Verben: sehen, beraten, anpassen, entdecken, schaerfen',
    treatment: 'Premium-Glow-Tint, Aspect 4:5 Portrait fuer Brillen, 16:9 fuer Geschaeft, runde Edges 16px',
    badges: ['Optikverband Schweiz', 'Augenoptik-zertifiziert', 'Premium-Brand-Partner'],
    hero_pattern: 'Center-Stage-Hero mit Brillen-Macro + Italic-Headline, Marken-Marquee unter Hero',
  },
  F7_maurer: {
    cluster: 'F', cluster_name: 'Lokales KMU',
    signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'cabinet-grotesk + satoshi',
    palette: { primary: '#3a3530', accent: '#c98a5a', dark: '#1c1814', light: '#f5f0e8', neutral: '#bca896' },
    layout_dna: 'Industrial-Editorial mit Bau-Halle-Hero, Projekte-Slider mit Vorher-Nachher, Massnahmen-Grid (Mauer, Bodenplatte, Sanierung), Stat-Bar Jahre Bauwerke',
    image_mood: 'Mauer-Detail Macro, Baustelle-Architektur, Maurer-am-Werk, Beton-frisch-glatt, Bauwerk-fertig',
    voice: 'Solide, terminsicher, lokal, ehrlich. Verben: mauern, bauen, sanieren, fundamentieren, verfugen',
    treatment: 'Beton-Grau-Tint, Aspect 16:9 fuer Bauwerke, scharfe Edges 4px',
    badges: ['SBV Schweizer Baumeister', 'EKAS-zertifiziert', 'Lehrbetrieb seit Jahr X'],
    hero_pattern: 'Asymm-Hero 60/40 mit Bauwerk-Image + Headline, Stat-Bar mit Anzahl Bauwerke',
  },
  // ── Cluster D · Beratung ────────────────────────────────────────────
  D1_treuhand: {
    cluster: 'D', cluster_name: 'Beratung',
    signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#1f2935', accent: '#8a9bac', dark: '#0c1018', light: '#f4f6f9', neutral: '#bcc4cc' },
    layout_dna: 'Editorial-Magazin mit asymmetrischen Splits, Sticky-Side-Caption mit Werten, Service-Story (Buchhaltung, Steuern, Beratung), Stat-Bar Jahre/Mandate',
    image_mood: 'Buero-Architektur modern, Hand-mit-Stift, Dokumente-Detail, Berater-im-Gespraech, Schreibtisch-Detail',
    voice: 'Praezise, vertrauensvoll, langfristig, persoenlich. Verben: betreuen, optimieren, planen, begleiten, klaren',
    treatment: 'Cool-Slate-Tint, Aspect 4:5 Portrait fuer Personen, 16:9 fuer Buero, runde Edges 8px',
    badges: ['EXPERTsuisse', 'Treuhand|Suisse Mitglied', 'FINMA-konform', 'Mandat seit Jahr X'],
    hero_pattern: 'Hero mit grosser Variable-Font-Reveal-Headline + ruhigem Buero-Bild, Stat-Bar mit Mandaten/Jahren',
  },
  D2_anwalt: {
    cluster: 'D', cluster_name: 'Beratung',
    signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#2a2018', accent: '#a8804a', dark: '#15100b', light: '#f7f1e8', neutral: '#bca896' },
    layout_dna: 'Editorial-Magazin mit asymmetrischen 70/30 Splits, Sticky-Side-Caption mit Rechtsgebieten, Anwalt-Profile als Magazin-Spread, Mandat-Stories als Editorial-Quotes',
    image_mood: 'Buecherregal-Detail, Anwaltsrobe-im-Hintergrund subtil, Hand-mit-Vertrag, Buero-Architektur klassisch-modern',
    voice: 'Klar, kompetent, diskret, mandantenorientiert. Verben: vertreten, durchsetzen, beraten, schuetzen, verhandeln',
    treatment: 'Warm-Brown-Tint subtle, Aspect 4:5 Portrait fuer Anwaelte, runde Edges 8px',
    badges: ['SAV Mitglied', 'Patentanwalt-zertifiziert', 'Mandat seit Jahr X'],
    hero_pattern: 'Asymm-Hero 70/30 mit grosser ernster Headline, Italic-Sub, Anwalt-Portrait rechts',
  },
  D3_coach: {
    cluster: 'D', cluster_name: 'Beratung',
    signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#2c3a2c', accent: '#8c9c7c', dark: '#161e16', light: '#f4f7f2', neutral: '#c4ccbc' },
    layout_dna: 'Editorial-Memoir mit Hero-Quote, Sticky-Side-Caption mit Werten, Persoenliche-Story-Section, Methoden-Bento-Grid',
    image_mood: 'Person-im-Gespraech, Notizbuch-mit-Notizen, ruhiger Raum mit Kamin oder Park-Aussicht, Hand-Geste',
    voice: 'Reflektiert, empathisch, klar, persoenlich. Verben: zuhoeren, klaren, oeffnen, herausfinden, begleiten',
    treatment: 'Warm-Forest-Tint, Aspect 4:5 Portrait, runde Edges 12px',
    badges: ['ICF zertifiziert', 'Systemischer Coach', 'BSO Mitglied'],
    hero_pattern: 'Hero mit grosser Italic-Quote, Variable-Font-Reveal Subtitel, Coach-Portrait rechts in 4:5',
  },
  // ── Cluster A · Editorial/Atelier ───────────────────────────────────
  A1_architekt: {
    cluster: 'A', cluster_name: 'Editorial/Atelier',
    signature_effekt: 1, signature_name: 'Splat',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#1a1814', accent: '#b8a878', dark: '#0a0908', light: '#f4f1ec', neutral: '#c4b8a8' },
    layout_dna: 'Awwwards-Editorial mit Splat-3D-Hero, Projekte als Magazin-Spreads asymm. 60/40, Vertikale Section-Eyebrows, Sticky-Side-Captions mit Bauphase-Notes, Bento-Grid Materialdetails',
    image_mood: 'Architektur-Modell-3D-scan, Bauteil-Detail Macro, Lichtfuehrung im Raum, Material-Komposition, leere Raumszene',
    voice: 'Konzeptuell, raeumlich, materiell, atemberaubend-zurueckhaltend. Verben: entwerfen, gestalten, formen, raeumlich-denken',
    treatment: 'Mono-Cool-Slate, Aspect 16:9 oder Fullbleed, scharfe Edges 0px',
    badges: ['SIA Mitglied', 'BSA aufgenommen', 'Award X gewonnen'],
    hero_pattern: 'Splat-Modell rotiert auto im Hero-Hintergrund, daruebner Variable-Font-Reveal-Headline minimalistisch',
  },
  // ── Cluster B · Hospitality ─────────────────────────────────────────
  B1_hospitality: {
    cluster: 'B', cluster_name: 'Hospitality',
    signature_effekt: 5, signature_name: 'Theatre.js-Scroll',
    fontshare_pairing: 'clash-display + cabinet-grotesk',
    palette: { primary: '#2a1c1c', accent: '#c4905a', dark: '#150d0d', light: '#f7f0e8', neutral: '#d4b896' },
    layout_dna: 'Theatre-Scroll-Storytelling, Hero mit Lokal-Atmosphaere, Menu/Zimmer als Bento-Grid, Booking-Flow prominent, Lokal-Geschichte als Editorial-Magazin-Spread',
    image_mood: 'Lokal-Atmosphaere warm-erleuchtet, Detail-am-Tisch, Gast-im-Genuss, Architektur des Lokals, Region-Landschaft',
    voice: 'Einladend, gastfreundlich, lokal-verwurzelt, sinnlich. Verben: empfangen, geniessen, willkommen-heissen, verweilen',
    treatment: 'Warm-Glow-Tint, Aspect 16:9 fuer Lokal, 4:5 fuer Gerichte/Zimmer',
    badges: ['Gastronomie-Verband', 'GaultMillau X Punkte', 'TripAdvisor-Award'],
    hero_pattern: 'Theatre-Scroll-Hero mit Atmosphaere-Bild als Crossfade, Italic-Hauptheadline, Buchen-CTA prominent',
  },
  // ── Cluster C · Premium-Brand ───────────────────────────────────────
  C1_premiumbrand: {
    cluster: 'C', cluster_name: 'Premium-Brand',
    signature_effekt: 2, signature_name: 'WebGL-Distortion',
    fontshare_pairing: 'clash-display + cabinet-grotesk',
    palette: { primary: '#1c1814', accent: '#a88058', dark: '#0c0a08', light: '#f4f0ea', neutral: '#bca088' },
    layout_dna: 'Center-Stage-Editorial mit Produkt-Distortion-Hero, Marquee mit Kollektion-Names, Bento-Grid Produkte, Manufaktur-Story als Magazin-Spread, Dunkel-Section fuer Material-Story',
    image_mood: 'Produkt-Macro im Studiolicht, Manufaktur-Hand-am-Werk, Material-Detail Macro, Atelier-Architektur',
    voice: 'Kuratiert, sinnlich, handwerklich-praezise, zeitlos. Verben: gestalten, fertigen, formen, kreieren, kuratieren',
    treatment: 'Premium-Studio-Tint, Aspect 4:5 Portrait fuer Produkte, runde Edges 16px',
    badges: ['Made in Switzerland', 'Manufaktur seit Jahr X', 'Kollektions-Award'],
    hero_pattern: 'Center-Stage Produkt-Distortion-Hero mit Italic-Manifest-Quote, Marquee unter Hero mit Kollektion-Names',
  },
  // ── Cluster G · Tech/Digital ────────────────────────────────────────
  G1_techdigital: {
    cluster: 'G', cluster_name: 'Tech/Digital',
    signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'cabinet-grotesk + satoshi',
    palette: { primary: '#1c2030', accent: '#7c8cdc', dark: '#0c0e18', light: '#f0f2f7', neutral: '#a8b0cc' },
    layout_dna: 'Tech-Editorial mit Mesh-Gradient-Hero, Service-Bento, Case-Studies als Magazin-Spread, Process-Story als horizontaler Scroll, dunkles CTA-Section',
    image_mood: 'UI-Mockup-Detail, Code-Editor subtil, Team-Workspace, abstrakte Mesh-Visuals, Office-Architektur',
    voice: 'Praezise, modern, ergebnisorientiert, partnerschaftlich. Verben: entwickeln, automatisieren, skalieren, integrieren, optimieren',
    treatment: 'Cool-Tech-Tint, Aspect 16:9 fuer UIs, runde Edges 12px',
    badges: ['ISO 27001', 'Microsoft Partner', 'AWS Solutions Architect'],
    hero_pattern: 'Mesh-Gradient-Fullbleed-Hero mit grosser Headline + Letter-Reveal, dunkle Service-Section direkt unten',
  },
  // ── Cluster Defaults (Fallback wenn kein spezifisches Sub-Profile matched) ─
  E_default: { cluster: 'E', cluster_name: 'Medizin/Wellness', signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#2d4a3a', accent: '#6b8e7f', dark: '#1a2820', light: '#f4f1ec', neutral: '#c9a48a' },
    layout_dna: 'Editorial mit asymmetrischen Splits, Sticky-Side-Caption, Bento-Galerie',
    image_mood: 'Behandlungs-Detail, Praxis-Architektur, Therapeut-am-Werk',
    voice: 'Praesent, kompetent, lokal verankert',
    treatment: 'Sage-Duotone, Aspect 4:5 Hero',
    badges: ['Berufsverband', 'Krankenkassen anerkannt'],
    hero_pattern: 'Asymm-Hero mit Variable-Font-Reveal-Headline ueber Behandlungs-Detail',
  },
  F_default: { cluster: 'F', cluster_name: 'Lokales KMU', signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'cabinet-grotesk + satoshi',
    palette: { primary: '#2a2520', accent: '#b8956b', dark: '#15110d', light: '#f7f1e8', neutral: '#d4b896' },
    layout_dna: 'Handwerk-Editorial mit asymmetrischer Hero, Werks-Bento, Storyboard-Prozess',
    image_mood: 'Werkstatt-Detail, Hand-am-Werkstueck, fertiges Werk im Raum',
    voice: 'Direkt, handwerklich, lokal, ehrlich',
    treatment: 'Warm-Erdton-Tint, Aspect 16:9 Section',
    badges: ['Berufsverband', 'Lehrbetrieb'],
    hero_pattern: 'Asymm-Hero 60/40 mit Werks-Image und grosser Headline',
  },
  D_default: { cluster: 'D', cluster_name: 'Beratung', signature_effekt: 3, signature_name: 'Variable-Font Reveal',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#1f2935', accent: '#8a9bac', dark: '#0c1018', light: '#f4f6f9', neutral: '#bcc4cc' },
    layout_dna: 'Editorial-Magazin mit asymm. Splits, Sticky-Side-Caption, Service-Story',
    image_mood: 'Buero, Hand-mit-Stift, Berater-im-Gespraech',
    voice: 'Praezise, vertrauensvoll, persoenlich',
    treatment: 'Cool-Slate-Tint, Aspect 4:5 Portrait',
    badges: ['Berufsverband', 'Mandat seit Jahr X'],
    hero_pattern: 'Hero mit grosser Variable-Font-Reveal-Headline + ruhigem Buero-Bild',
  },
  A_default: { cluster: 'A', cluster_name: 'Editorial/Atelier', signature_effekt: 1, signature_name: 'Splat',
    fontshare_pairing: 'erode + satoshi',
    palette: { primary: '#1a1814', accent: '#b8a878', dark: '#0a0908', light: '#f4f1ec', neutral: '#c4b8a8' },
    layout_dna: 'Awwwards-Editorial mit Splat-Hero, Magazin-Spreads, Vertikale Section-Eyebrows',
    image_mood: 'Atelier-Architektur, Material-Komposition, Werkdetail',
    voice: 'Konzeptuell, raeumlich, zurueckhaltend',
    treatment: 'Mono-Cool-Slate, Fullbleed',
    badges: ['Berufsverband', 'Award X'],
    hero_pattern: 'Splat-Hero mit minimaler Headline',
  },
  B_default: { cluster: 'B', cluster_name: 'Hospitality', signature_effekt: 5, signature_name: 'Theatre.js-Scroll',
    fontshare_pairing: 'clash-display + cabinet-grotesk',
    palette: { primary: '#2a1c1c', accent: '#c4905a', dark: '#150d0d', light: '#f7f0e8', neutral: '#d4b896' },
    layout_dna: 'Theatre-Scroll-Storytelling, Bento-Grid Menue/Zimmer, Lokal-Geschichte',
    image_mood: 'Lokal-Atmosphaere warm, Gast-Detail, Region-Landschaft',
    voice: 'Einladend, gastfreundlich, lokal-verwurzelt',
    treatment: 'Warm-Glow-Tint, Aspect 16:9',
    badges: ['Gastronomie-Verband', 'GaultMillau'],
    hero_pattern: 'Theatre-Scroll-Hero mit Atmosphaere-Bild und Italic-Hauptheadline',
  },
  C_default: { cluster: 'C', cluster_name: 'Premium-Brand', signature_effekt: 2, signature_name: 'WebGL-Distortion',
    fontshare_pairing: 'clash-display + cabinet-grotesk',
    palette: { primary: '#1c1814', accent: '#a88058', dark: '#0c0a08', light: '#f4f0ea', neutral: '#bca088' },
    layout_dna: 'Center-Stage-Editorial mit Distortion-Hero, Marquee, Bento-Grid Produkte',
    image_mood: 'Produkt-Macro Studiolicht, Manufaktur-Hand, Material-Detail',
    voice: 'Kuratiert, handwerklich, zeitlos',
    treatment: 'Premium-Studio-Tint, Aspect 4:5',
    badges: ['Made in Switzerland', 'Manufaktur'],
    hero_pattern: 'Distortion-Hero mit Italic-Manifest-Quote',
  },
  G_default: { cluster: 'G', cluster_name: 'Tech/Digital', signature_effekt: 4, signature_name: 'Mesh-Gradient + Letter-Reveal',
    fontshare_pairing: 'cabinet-grotesk + satoshi',
    palette: { primary: '#1c2030', accent: '#7c8cdc', dark: '#0c0e18', light: '#f0f2f7', neutral: '#a8b0cc' },
    layout_dna: 'Tech-Editorial mit Mesh-Gradient-Hero, Service-Bento, Case-Studies',
    image_mood: 'UI-Mockup, Team-Workspace, Mesh-Visuals',
    voice: 'Praezise, ergebnisorientiert, partnerschaftlich',
    treatment: 'Cool-Tech-Tint, Aspect 16:9',
    badges: ['ISO 27001', 'Tech-Partner'],
    hero_pattern: 'Mesh-Gradient-Hero mit grosser Headline + Letter-Reveal',
  },
};

function lookupProfile(branche, clusterHint) {
  const b = (branche || '').toLowerCase();
  const map = [
    [/physio|physiotherapie/, 'E1_physio'],
    [/kosmetik|beauty|aesthet|spa/, 'E2_kosmetik'],
    [/yoga|pilates|meditation/, 'E3_yoga'],
    [/zahn|dentist|dental|kiefer/, 'E4_zahnarzt'],
    [/coiffeur|hair|friseur|barber/, 'F1_coiffeur'],
    [/garage|garagist|auto.?werkstatt|mechan/, 'F2_garagist'],
    [/maler|maler.?betrieb|painter/, 'F3_maler'],
    [/sanitar|sanitaer|installateur|plumber/, 'F4_sanitaer'],
    [/schreiner|carpenter|tischler/, 'F5_schreiner'],
    [/optiker|brillen|optic/, 'F6_optiker'],
    [/maurer|bau.?untern|bau.?gesch|construction/, 'F7_maurer'],
    [/treuhand|fiduciary|buchhaltung/, 'D1_treuhand'],
    [/anwalt|kanzlei|legal|rechtsanw/, 'D2_anwalt'],
    [/coach/, 'D3_coach'],
    [/architekt|architect/, 'A1_architekt'],
    [/galerie|gallery|museum/, 'A1_architekt'],
    [/hotel|gastro|restaurant|cafe/, 'B1_hospitality'],
    [/manufaktur|atelier|schmuck|mode|jewelr/, 'C1_premiumbrand'],
    [/tech|software|digital|saas/, 'G1_techdigital'],
  ];
  for (const [re, slug] of map) if (re.test(b)) return { slug, ...BRANCH_PROFILES[slug] };
  // Cluster-Default
  const c = (clusterHint || 'F').toUpperCase().charAt(0);
  const def = BRANCH_PROFILES[c + '_default'] || BRANCH_PROFILES.F_default;
  return { slug: c + '_default', ...def };
}

// V35 Pflicht-Code-Snippets pro Signature-Effekt (LLM kriegt das als Anchor)
function signatureSnippet(eff) {
  switch (eff) {
    case 1: return `// SPLAT (Three.js gsplat) — kleiner 3D-Splat im Hero-Hintergrund\n<script type="module">\n  import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';\n  // Setup: Scene + PerspectiveCamera + WebGLRenderer auf canvas#hero-splat\n  // Subtle auto-rotate. opacity 0.4. prefers-reduced-motion → static.\n<\/script>\n<canvas id="hero-splat" style="position:absolute;inset:0;opacity:.4;pointer-events:none;z-index:0"></canvas>`;
    case 2: return `// WEBGL-DISTORTION (Curtains.js) — sanfter Wave auf Hero-Bild bei Scroll\n<script src="https://cdn.jsdelivr.net/npm/curtainsjs@8.1.5/dist/curtains.umd.min.js"><\/script>\n<script>\n  const curtains = new window.Curtains.Curtains({container: 'curtains-canvas'});\n  // Plane mit hero img, fragment-shader: float wave = sin(uv.y * 8.0 + uTime) * .03;\n  // Auto-pause bei prefers-reduced-motion.\n<\/script>`;
    case 3: return `// VARIABLE-FONT REVEAL (Splitting + Recursive) — Letter-Glyph-Achsen anim\n<style>\n  @import url('https://fonts.googleapis.com/css2?family=Recursive:slnt,wght@-15..0,300..1000&display=swap');\n  .reveal .char{font-family:'Recursive',serif;font-variation-settings:"wght" 300, "slnt" -15;display:inline-block;opacity:0;transform:translateY(.4em);transition:opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1), font-variation-settings .9s ease;transition-delay:calc(var(--char-index) * .04s)}\n  .reveal.is-revealed .char{opacity:1;transform:none;font-variation-settings:"wght" 700, "slnt" 0}\n<\/style>\n<h1 class="reveal" data-splitting>Headline-Text</h1>\n<script>Splitting();new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('is-revealed')),{threshold:.4}).observe(document.querySelector('.reveal'));<\/script>`;
    case 4: return `// MESH-GRADIENT + LETTER-REVEAL (Whatamesh + Splitting)\n<canvas id="mesh-grad" style="position:absolute;inset:0;z-index:0;opacity:.7"></canvas>\n<script type="module">\n  import {Gradient} from 'https://unpkg.com/whatamesh@1.1/dist/whatamesh.es.js';\n  const g=new Gradient();g.initGradient('#mesh-grad');\n  // Farben in CSS-Variablen --gradient-color-1..4 setzen aus Profile.palette\n<\/script>`;
    case 5: return `// THEATRE.JS-SCROLL — choreografierter Hero-Crossfade ueber 3 Bilder\n<script type="module">\n  import core from 'https://cdn.jsdelivr.net/npm/@theatre/core@0.7/dist/core.es.js';\n  // Project + Sheet + Object mit opacity-anim. ScrollListener mappt scrollY auf timeline.position.\n<\/script>`;
    default: return '// (Kein Signature-Snippet, freie Wahl)';
  }
}

// V35 Master-System-Prompt-Builder
function buildV35SystemPrompt(profile, mockupId, supabaseUrl) {
  const p = profile;
  const pal = p.palette;
  const sig = signatureSnippet(p.signature_effekt);
  return `Du baust einen Premium-Website-Mockup auf Awwwards-SOTM-Niveau fuer ein Schweizer KMU.\n\nGRUNDPRINZIP: Editorial vor Marketing. Whitespace vor Dichte. Konkretheit vor Floskel. Diese Site soll wirken wie ein gedrucktes Magazin im Browser, nicht wie ein generischer KMU-Section-Stack. Sub-Profile: ${p.slug || p.cluster + '_default'} (${p.cluster_name}).\n\nLAYOUT-DNA (PFLICHT-INTERPRETATION):\n${p.layout_dna}\n\nHERO-PATTERN (PFLICHT):\n${p.hero_pattern}\n\nDIESE 5 LAYOUT-MUSTER SIND PFLICHT (mind. 4 von 5 muessen vorkommen):\n1. Asymmetrischer Editorial-Split (60/40 oder 70/30, niemals 50/50 ausser fuer Vergleichs-Gegenstellung)\n2. Sticky-Side-Caption: Text bleibt sticky waehrend Bild/Content scrollt (verlaengert die emotionale Verweildauer)\n3. Magazin-Eyebrow vertikal: writing-mode:vertical-rl auf 1-2 Section-Labels fuer Editorial-Charakter\n4. Bento-Grid mit Variable-Hoehen (1 grosse + 2-3 kleine Cards in einer Sektion)\n5. Marquee-Ribbon: horizontaler Lauftext zwischen 2 Sections als visueller Atemzug\n\nWHITESPACE-WERTE (PFLICHT, KEINE ABWEICHUNG):\n- Section-Padding: 160px desktop / 96px mobile vertikal (padding-block)\n- Container max-width: 1320px, padding-inline 32px desktop / 20px mobile\n- H1-Block-Margin-Bottom: 48px desktop / 32px mobile\n- Inter-Section-Margin: 0 (Padding macht den Atem)\n- Hero-Hoehe: min(85vh, 800px) desktop / 78vh mobile, NIEMALS 100vh\n\nTYPOGRAFIE (PFLICHT):\n- Display-Font: ${p.fontshare_pairing.split('+')[0].trim()} fuer H1-H2 (Fontshare)\n- Body-Font: ${p.fontshare_pairing.split('+')[1].trim()} fuer H3-H6 + p (Fontshare)\n- H1: clamp(3.2rem, 8.5vw, 6.8rem), letter-spacing -0.03em, line-height 0.95, font-weight 600-700\n- H2: clamp(2.4rem, 5vw, 4rem), letter-spacing -0.025em, line-height 1.05\n- H3: 1.5-1.75rem, weight 500\n- Body: 17px desktop / 16px mobile, line-height 1.55\n- Eyebrow: 0.78rem, uppercase, letter-spacing 0.18em, weight 500\n- Display-Quote: italic, max 2 Zeilen, in dunklen Sections weiss\n\nCOLOR-PALETTE (PFLICHT, KEIN HEX ERFINDEN, NUR DIESE 5):\n--primary: ${pal.primary}\n--accent: ${pal.accent}\n--dark: ${pal.dark}\n--light: ${pal.light}\n--neutral: ${pal.neutral}\nVerwende: primary fuer Body-Text + primaere Buttons + Logo. accent fuer Hover-States + einzelne Headlines + Akzent-Linien. dark fuer mind. 1 Dark-Section background (z.B. ueber-uns oder cta). light als Default Page-Background. neutral fuer Stat-Numbers + Eyebrow + dezente Trennlinien.\n\nIMAGE-BEHANDLUNG (PFLICHT):\n${p.treatment}\nImage-Mood-Direktive: ${p.image_mood}\nAspect-Ratio per Sektion fix:\n- Hero: aus hero_pattern\n- Leistungen-Cards: 4:5 Portrait\n- Team: 3:4 Portrait\n- Galerie: gemischt 1:1, 3:4, 16:9 in Bento-Grid\n- Image-Caption: vertikal sticky neben Bild ODER overlay-bottom mit grain (8% noise)\nPflicht: Alle Section-Bilder haben Editorial-Caption-Klasse mit Photo-Credit oder Quote.\n\nCONTENT-STORYTELLING (PFLICHT):\nVoice: ${p.voice}\nStory-Arc ueber die 9 Pflicht-Sektionen + Footer:\n1 #hero: Versprechen in 1 Satz, max 12 Worte. Nicht Was-wir-tun, sondern Wie-es-sich-anfuehlt. Sub-Headline 1 Satz max 18 Worte.\n2 #trust: Konkrete Zahlen (Jahre, Patienten/Kunden, Bewertung), Cert-Badges aus Profile: ${p.badges.join(', ')}\n3 #ueber-uns: Person mit Foto, max 80 Worte Story, 3 Werte als Eyebrow-Cards\n4 #leistungen: 3-4 Service-Cards. Pro Card: Name (max 4 Worte), 1-Satz-Was-passiert (max 18 Worte), 3-Punkt-Liste, KEIN Pricing\n5 #booking: 3-Step Interactive State-Machine (Service > Therapeut/Stylist > Slot) mit Live-Summary, Confirm-Button erst aktiv wenn alle 3 gewaehlt. Calendly-Link als Backup.\n6 #team: 3-4 Cards mit Foto 3:4, Name, Rolle, Specialty (max 6 Worte)\n7 #reviews: Mind. 6 Testimonials mit Aggregate-Score, lokal (Vornamen aus Region passend), 5-Sterne, Avatar\n8 #standort: Adresse, OEV-Anbindung, Auto, Tel, Mail, Oeffnungszeiten + Google-Maps-iframe\n9 #faq: 5+ branchenspezifische Fragen Akkordion\n10 footer: Adresse, Oeffnung, Rechtliches\n\nPOSITIVE SPRACH-DIREKTIVE (PFLICHT):\n- Saetze max 18 Worte, Durchschnitt 12 Worte\n- Aktive Verben aus Profile.voice statt passive Allgemeinplaetze\n- KEIN "Wir bieten ...", stattdessen "Bei [Firma] [konkrete Aktion]"\n- Lokaler Bezug Pflicht: Mind. 3x Stadt/Quartier/Region erwaehnen\n- Branche-Vokabular aus Profile.voice nutzen, mind. 4 dieser Verben einsetzen\n- KEIN generic Filler. Wenn keine Daten vorhanden, lieber kuerzer schreiben als faken\n\nFORBIDDEN-WORDS (HARD-STOP):\nGame-Changer, innovativ, Marktfuehrer, revolutionaer, spannend, toll, super, klasse, Synergien, ganzheitlich (max 1x), nahtlos, state-of-the-art, world-class, Loesung, Mehrwert, Tradition trifft Moderne, Leidenschaft, Excellence.\n\nLIBRARIES PFLICHT (CDN im Head):\n- Lenis https://cdn.jsdelivr.net/npm/lenis@1.0.42/dist/lenis.min.js\n- Motion One https://cdn.jsdelivr.net/npm/motion@10.18.0/dist/motion.umd.js\n- Splitting.js https://unpkg.com/splitting@1.0.6/dist/splitting.min.js\n- Lottie-web https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js\n- Fontshare: https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&f[]=satoshi@400,500,700&f[]=erode@400,500,700&f[]=clash-display@500,700&display=swap\n\nSIGNATURE-EFFEKT (PFLICHT mit Code-Snippet als Anchor):\n${p.signature_name} (effekt #${p.signature_effekt})\n${sig}\n\nJS-PFLICHT:\n- Lenis init mit lerp 0.08\n- Splitting() init fuer alle [data-splitting] Elemente\n- IntersectionObserver fuer [data-reveal] mit 1500ms-Fallback (visible auch bei Observer-Fail)\n- Magnetic-Button-Hover .btn-magnetic mit Motion (translate3d max 8px)\n- prefers-reduced-motion respektieren (alle Animations off)\n- Sticky-Nav scroll-shrink: bei scrollY > 80 add class .nav-shrunk\n\nV36.3 PREMIUM-WOW-PFLICHT-CODE-SNIPPETS (alle 7 sind PFLICHT, kopieren ist OK):\n\n1. TYPING_HERO (Hero-Headline tippt sich Buchstabe fuer Buchstabe):\n<style>\n.typing-text{display:inline-block;border-right:2px solid var(--accent);animation:caret-blink .8s step-end infinite}\n.typing-text.done{border-right:none}\n@keyframes caret-blink{50%{border-color:transparent}}\n</style>\n<h1><span class="typing-text" data-text="HEADLINE-TEXT-HIER"></span></h1>\n<script>(()=>{const el=document.querySelector(".typing-text");if(!el||!el.dataset.text)return;const t=el.dataset.text;let i=0;const tick=()=>{if(i<=t.length){el.textContent=t.slice(0,i);i++;setTimeout(tick,55+Math.random()*40)}else{el.classList.add("done")}};setTimeout(tick,400)})();<\/script>\n\n2. MAGNETIC_BUTTONS (Cursor-magnetisches Pull):\n<script>document.querySelectorAll(".btn-magnetic").forEach(b=>{b.addEventListener("mousemove",e=>{const r=b.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*0.25;const y=(e.clientY-r.top-r.height/2)*0.25;b.style.transform="translate3d("+x+"px,"+y+"px,0)"});b.addEventListener("mouseleave",()=>{b.style.transform="translate3d(0,0,0)"})});<\\/script>\n\n3. STAGGER_REVEAL (Worte/Lines fadet 80ms gestaffelt):\n<style>\n.stagger>*{opacity:0;transform:translateY(28px) blur(8px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1),filter .9s ease}\n.stagger.is-revealed>*{opacity:1;transform:none;filter:blur(0)}\n.stagger.is-revealed>*:nth-child(1){transition-delay:.05s}\n.stagger.is-revealed>*:nth-child(2){transition-delay:.13s}\n.stagger.is-revealed>*:nth-child(3){transition-delay:.21s}\n.stagger.is-revealed>*:nth-child(4){transition-delay:.29s}\n.stagger.is-revealed>*:nth-child(5){transition-delay:.37s}\n.stagger.is-revealed>*:nth-child(n+6){transition-delay:.45s}\n</style>\n<script>new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("is-revealed")),{threshold:.2}).observe(document.querySelectorAll(".stagger").forEach?null:null);document.querySelectorAll(".stagger").forEach(el=>new IntersectionObserver(es=>es.forEach(en=>en.isIntersecting&&en.target.classList.add("is-revealed")),{threshold:.2}).observe(el));<\/script>\n\n4. STICKY_CTA_MOBILE (bottom-fixed Termin-Bar bei <768px):\n<style>\n.sticky-cta-mobile{display:none}\n@media(max-width:768px){.sticky-cta-mobile{display:flex;position:fixed;bottom:0;left:0;right:0;padding:1rem;background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);border-top:1px solid rgba(0,0,0,.08);z-index:90;justify-content:center;transform:translateY(100%);transition:transform .5s cubic-bezier(.16,1,.3,1)}.sticky-cta-mobile.is-visible{transform:translateY(0)}.sticky-cta-mobile a{flex:1;text-align:center;padding:.85rem;background:var(--primary);color:var(--light);border-radius:6px;font-weight:500;text-decoration:none}}\n</style>\n<div class="sticky-cta-mobile"><a href="https://calendly.com/valentin-fischer-vf-services/30min" target="_blank">Termin vereinbaren</a></div>\n<script>setTimeout(()=>document.querySelector(".sticky-cta-mobile")?.classList.add("is-visible"),800);<\/script>\n\n5. PARALLAX_HERO (Hero-Bild bewegt sich 0.3x scrollY):\n<script>const heroImg=document.querySelector(".hero-image, .hero img, [data-parallax]");if(heroImg){let raf=null;window.addEventListener("scroll",()=>{if(raf)return;raf=requestAnimationFrame(()=>{heroImg.style.transform="translate3d(0,"+(window.scrollY*.3)+"px,0)";raf=null})},{passive:true})}<\\/script>\n\n6. IMAGE_REVEAL_CINEMA (Section-Bilder mit clip-path-reveal on scroll):\n<style>\n.cinema-reveal{clip-path:inset(0 100% 0 0);transition:clip-path 1.2s cubic-bezier(.16,1,.3,1)}\n.cinema-reveal.is-revealed{clip-path:inset(0 0 0 0)}\n</style>\n<script>document.querySelectorAll(".cinema-reveal").forEach(el=>new IntersectionObserver(es=>es.forEach(en=>en.isIntersecting&&en.target.classList.add("is-revealed")),{threshold:.3}).observe(el));<\/script>\n\n7. LOAD_SEQUENCE (choreografierter Page-Load Logo->Hero-Bg->Stats):\n<style>\n.load-seq{opacity:0;transform:translateY(16px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}\nbody.is-loaded .load-seq{opacity:1;transform:none}\nbody.is-loaded .load-seq[data-load-step="1"]{transition-delay:.4s}\nbody.is-loaded .load-seq[data-load-step="2"]{transition-delay:.8s}\nbody.is-loaded .load-seq[data-load-step="3"]{transition-delay:1.2s}\n</style>\n<script>window.addEventListener("load",()=>setTimeout(()=>document.body.classList.add("is-loaded"),120));<\/script>\n\nWende jedes der 7 PFLICHT-Snippets mind. 1x an. Verstoesse fuehren zur Iteration durch Visual-Verify.\n\nGOOGLE MAPS PFLICHT-IFRAME:\n<iframe src="https://maps.google.com/maps?q=ADRESSE&t=&z=16&ie=UTF8&iwloc=&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:100%;border:0"></iframe>\n\nCHATBOT-WIDGET PFLICHT (V35.4 default-closed):\nFloating-Button bottom-right 60x60 (primary-color, Chat-Icon, 3s pulse). DIESER BUTTON IST IMMER ANKLICKBAR und immer sichtbar.\nDas Panel-Container 380x520 weiss + Editorial-shadow MUSS initial GESCHLOSSEN sein: display:none ODER aria-hidden="true" + opacity:0 + transform:translateY(20px). NIEMALS beim Page-Load offen rendern.\nKlick auf Floating-Button toggelt das Panel auf display:flex + opacity:1 + transform:none (slide-up Animation).\nIm geoeffneten Panel: Header "Chat mit [Brand]" + Subtitle "Demo · 24/7 · vf-services". 4 Chip-Fragen branchenrelevant.\nBei Klick auf eine Chip-Frage: Bot-Message mit 3-Dot-Typing-Indicator (800ms) + Demo-Antwort.\nClose-Button (X) im Panel-Header schliesst Panel zurueck zu display:none. Click outside Panel auch.\nKonkretes Pflicht-Markup-Pattern: <div class="chatbot-panel" id="chatbot-panel" style="display:none">...</div><button class="chatbot-fab" onclick="document.getElementById('chatbot-panel').style.display='flex'">...</button>\n\nBOOKING-CTA PFLICHT:\nALLE Termin-Buttons MUESSEN href="https://calendly.com/valentin-fischer-vf-services/30min" target="_blank" rel="noopener" haben. KEIN href="#" oder href="javascript:".\nBooking-Section MUSS zusaetzlich einen direkten Calendly-iframe oder Link-Card mit Calendly-URL haben.\n\nMOBILE-FIRST PFLICHT:\nLayout primaer fuer 380px Viewport, dann hochskalieren.\nTouch-Targets min 48x48px.\nKeine Hover-only-Interaktion (alle Hovers haben tap-Variante).\nHero-Stats horizontal scrollbar bei <500px.\nNavigation als Hamburger bei <768px.\n\nSTICKY-NAV PFLICHT:\nHeader MUSS display:flex justify-content:space-between align-items:center sein.\nLogo links, Nav-Items zentral oder rechts, Termin-CTA ganz rechts.\nNIEMALS absolute positionierte Logos die Nav-Items ueberlappen.\nHeader position:sticky top:0 z-index:1000.\n\nANIMATIONS-FALLBACK PFLICHT:\nAlle scroll-triggered Animationen (fade-up, scroll-reveal, parallax) MUESSEN nach 1.2s sichtbar sein auch wenn IntersectionObserver fails. prefers-reduced-motion media-query als Reset.\n\nIMAGE-POOL-HIERARCHIE (V35.1):\nAm Ende dieses System-Prompts findest du den "BILDER-POOLS"-Block mit 3 priorisierten Pools:\n- AUTHENTIC POOL (Bilder vom Kunden gescraped, role-tagged: hero/gallery/team/generic) — BEVORZUGT fuer Header-Logo, Hero, Galerie-Sektion, Team-Cards\n- STOCK POOL (Pexels, branche-spezifisch) — fuer Service-Cards, Reviewer-Avatars, generische Detail-Shots, Fallback wenn Authentic leer\n- AI-GENERATED POOL — nur wenn Authentic + Stock fuer eine Sektion nicht passen\nPriorisierungs-Logik: AUTHENTIC > STOCK > AI. Authentic role=hero ZUERST in Hero. Authentic role=gallery in Galerie. Authentic role=team in Team-Cards. Erst wenn Authentic-Pool fuer eine Sektion nichts passendes hat, gehe zu STOCK. AI nur als letzte Option.\nVerwende AUSSCHLIESSLICH URLs aus diesen Pools. KEINE images.unsplash.com erfinden. KEIN Cloudinary-fetch-wrap noetig.\nWenn LOGO-Slot leer: Wordmark der Firma in Display-Font mit primary-Color statt img.\n\nSPRACH-PFLICHT:\nSchweizer Hochdeutsch (ss statt sz). Sie-Form. Keine Em-Dashes. Keine Floskeln. Mind. 10 sichtbare Bilder. KEIN Pricing sichtbar.\n\nTRACKING-PIXEL vor </body>:\n<img src="${supabaseUrl}/functions/v1/mockup-tracker?m=${mockupId}&e=view" width=1 height=1 style="position:absolute;left:-9999px;">\n\nOUTPUT: NUR komplettes HTML ab <!DOCTYPE html>. Keine Erklaerungen. Keine Code-Fences. Direkt DOCTYPE.`;
}
// =====================================================================
// === END V35 BRANCH-SUB-PROFILE-DNA ===================================
// =====================================================================

// === VFS PEXELS POOL (Patch A2) ===
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const __VFS_IMG_POOL_CACHE = {};
async function fetchPexelsPool(branche, cluster, count = 24) {
  if (!PEXELS_API_KEY) return [];
  const key = (branche + "|" + cluster).toLowerCase();
  if (__VFS_IMG_POOL_CACHE[key]) return __VFS_IMG_POOL_CACHE[key];
  const branchMap = {
    "physio": "physiotherapy treatment", "physiotherapie": "physiotherapy treatment",
    "kosmetik": "cosmetic skincare clinic spa", "coiffeur": "hair salon barbershop",
    "garagist": "car repair garage mechanic", "maler": "interior painter painting",
    "sanitaer": "plumber bathroom plumbing", "elektriker": "electrician electrical work",
    "schreiner": "carpenter woodworking workshop", "maurer": "construction mason building",
    "metallbau": "metalworker welder steel construction", "gartenbau": "landscape gardener garden",
    "bodenleger": "flooring installer parquet", "optiker": "optician eyewear store",
    "treuhand": "accountant office consulting", "anwalt": "lawyer office legal",
    "default": "modern office swiss professional"
  };
  const queries = [];
  for (const [k, v] of Object.entries(branchMap)) {
    if (branche && branche.toLowerCase().includes(k)) { queries.push(v); break; }
  }
  if (queries.length === 0) queries.push(branchMap.default);
  queries.push(cluster && cluster.toLowerCase().includes("medizin") ? "modern medical clinic interior" : "modern professional swiss interior");
  const all = [];
  for (const q of queries) {
    try {
      const r = await fetch("https://api.pexels.com/v1/search?per_page=" + Math.ceil(count/queries.length) + "&orientation=landscape&size=large&query=" + encodeURIComponent(q), { headers: { "Authorization": PEXELS_API_KEY } });
      if (!r.ok) continue;
      const j = await r.json();
      for (const p of (j.photos || [])) {
        all.push({ id: p.id, url: p.src.large2x || p.src.large, alt: (p.alt || q).slice(0, 60), photographer: p.photographer });
      }
    } catch (e) { console.log("[pexels] query failed:", q, e.message); }
  }
  console.log("[pexels] pool size:", all.length, "for", branche, "/", cluster);
  __VFS_IMG_POOL_CACHE[key] = all;
  return all;
}
function buildImageWhitelistPrompt(pool) {
  if (!pool || pool.length === 0) return "";
  const lines = pool.slice(0, 24).map((p, i) => `[IMG_${i+1}] ${p.url} alt="${p.alt}"`);
  return `\n\n=== VERFUEGBARE BILDER (PFLICHT-AUSWAHL) ===\nDu MUSST AUSSCHLIESSLICH die folgenden Bild-URLs verwenden. Erfinde KEINE neuen URLs (kein images.unsplash.com, kein erfundenes photo-XXX). Verwende NUR diese Pexels-URLs (und das vom step3 vorgegebene Hero-Bild). Direkt als img src einsetzen, KEIN Cloudinary-Fetch-Wrap noetig (Pexels liefert bereits optimiert):\n${lines.join("\n")}\n=== END BILDER ===\n`;
}
// === END VFS PEXELS POOL ===
// === VFS_FETCH_INTERCEPTOR (Patch A3) ===
const __VFS_ORIG_FETCH = globalThis.fetch;
let __VFS_POOL_PROMISE = null;
globalThis.fetch = async function(url, opts = {}) {
  const u = typeof url === "string" ? url : (url && url.url) || "";
  // Capture branche/cluster from pending_previews response
  if (u.includes("/rest/v1/pending_previews")) {
    const r = await __VFS_ORIG_FETCH.call(this, url, opts);
    try {
      const cl = r.clone();
      const j = await cl.json();
      if (Array.isArray(j) && j[0]) {
        if (j[0].branche && !globalThis.__VFS_BRANCHE) globalThis.__VFS_BRANCHE = j[0].branche;
        if (j[0].company && !globalThis.__VFS_BRANCHE) globalThis.__VFS_BRANCHE = j[0].company;
        if (j[0].branche_cluster) globalThis.__VFS_CLUSTER = j[0].branche_cluster;
        console.log("[Patch A3] pending_previews captured: branche=", globalThis.__VFS_BRANCHE, "cluster=", globalThis.__VFS_CLUSTER);
      }
    } catch(e) {}
    return r;
  }
  // V35.1: Inject Hybrid-Pool (Authentic > Stock > AI) into Anthropic system prompt
  if (u.includes("api.anthropic.com/v1/messages") && opts.method === "POST" && opts.body) {
    try {
      // Lazy-init Pexels (Stock) pool if missing
      if ((!globalThis.__VFS_PEXELS_POOL || !globalThis.__VFS_PEXELS_POOL.length) && globalThis.__VFS_BRANCHE && typeof fetchPexelsPool === "function") {
        if (!__VFS_POOL_PROMISE) __VFS_POOL_PROMISE = fetchPexelsPool(globalThis.__VFS_BRANCHE, globalThis.__VFS_CLUSTER || "professional", 24);
        globalThis.__VFS_PEXELS_POOL = await __VFS_POOL_PROMISE;
        console.log("[V35.1] Pexels-pool initialized, size:", (globalThis.__VFS_PEXELS_POOL || []).length);
      }
      const body = JSON.parse(opts.body);
      const hasAuth = Array.isArray(globalThis.__VFS_AUTHENTIC_POOL) && globalThis.__VFS_AUTHENTIC_POOL.length;
      const hasAi = Array.isArray(globalThis.__VFS_AI_POOL) && globalThis.__VFS_AI_POOL.length;
      const hasStock = Array.isArray(globalThis.__VFS_PEXELS_POOL) && globalThis.__VFS_PEXELS_POOL.length;
      if (body.system && (hasAuth || hasAi || hasStock)) {
        let inject = "";
        if ((hasAuth || hasAi || globalThis.__VFS_LOGO) && typeof buildHybridPoolPrompt === "function") {
          inject = buildHybridPoolPrompt({
            logo: globalThis.__VFS_LOGO || null,
            authentic: globalThis.__VFS_AUTHENTIC_POOL || [],
            stock: globalThis.__VFS_PEXELS_POOL || [],
            ai: globalThis.__VFS_AI_POOL || [],
          });
        } else if (hasStock && typeof buildImageWhitelistPrompt === "function") {
          // Fallback Pexels-only (kompat zu V35-Builds ohne Hybrid-Init)
          inject = buildImageWhitelistPrompt(globalThis.__VFS_PEXELS_POOL);
        }
        const marker = "BILDER-POOLS";
        const oldMarker = "VERFUEGBARE BILDER";
        if (inject && typeof body.system === "string" && !body.system.includes(marker) && !body.system.includes(oldMarker)) {
          body.system = body.system + inject;
          opts = { ...opts, body: JSON.stringify(body) };
          console.log("[V35.1] Hybrid-Pool injected: auth=" + ((globalThis.__VFS_AUTHENTIC_POOL || []).length) + " stock=" + ((globalThis.__VFS_PEXELS_POOL || []).length) + " ai=" + ((globalThis.__VFS_AI_POOL || []).length) + " logo=" + (globalThis.__VFS_LOGO ? "yes" : "no"));
        } else if (inject && Array.isArray(body.system) && !JSON.stringify(body.system).includes(marker)) {
          body.system.push({ type: "text", text: inject });
          opts = { ...opts, body: JSON.stringify(body) };
          console.log("[V35.1] Hybrid-Pool injected (array system)");
        }
      }
    } catch(e) { console.log("[V35.1] hybrid-inject failed:", e.message); }
  }
  return __VFS_ORIG_FETCH.call(this, url, opts);
};
console.log("[Patch A3] fetch interceptor installed");
// === END VFS_FETCH_INTERCEPTOR ===
// === A4_EAGER_INIT (Top-level Pool Init) ===
try {
  const _MOCKUP_ID = process.env.MOCKUP_ID;
  if (_MOCKUP_ID && typeof fetchPexelsPool === "function" && typeof VFS_SUPABASE_URL === "string" && typeof VFS_SUPABASE_SERVICE_KEY === "string") {
    const _sUrl = VFS_SUPABASE_URL + "/rest/v1/pending_previews?id=eq." + encodeURIComponent(_MOCKUP_ID) + "&select=*";
    const _r = await __VFS_ORIG_FETCH(_sUrl, { headers: { "apikey": VFS_SUPABASE_SERVICE_KEY, "Authorization": "Bearer " + VFS_SUPABASE_SERVICE_KEY } });
    if (_r.ok) {
      const _arr = await _r.json();
      const _rec = Array.isArray(_arr) ? _arr[0] : null;
      if (_rec) {
        const _branche = _rec.branche || _rec.company || "";
        const _cluster = _rec.branche_cluster || "";
        globalThis.__VFS_BRANCHE = _branche;
        globalThis.__VFS_CLUSTER = _cluster;
        globalThis.__VFS_PEXELS_POOL = await fetchPexelsPool(_branche, _cluster, 24);
        console.log("[A4 eager-init] pool ready:", (globalThis.__VFS_PEXELS_POOL || []).length, "branche:", _branche, "cluster:", _cluster);
      } else { console.log("[A4 eager-init] no pending_previews record for id:", _MOCKUP_ID); }
    } else { console.log("[A4 eager-init] supabase fetch failed:", _r.status); }
  } else { console.log("[A4 eager-init] missing prerequisites - MOCKUP_ID:", !!_MOCKUP_ID, "fetchPexelsPool:", typeof fetchPexelsPool, "VFS_SUPABASE_URL:", typeof VFS_SUPABASE_URL); }
} catch (e) { console.log("[A4 eager-init] failed:", e.message); }
// === END A4_EAGER_INIT ===





if (!MOCKUP_ID) throw new Error('MOCKUP_ID env required');

// V35.5.3: maxRetries 2->4, explicit Request-Timeout 5min gegen ConnectionTimeout/ConnectionError
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY, maxRetries: 4, timeout: 5 * 60 * 1000 });

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
  // VFS_POOL_HOOK (Patch A2): Pre-fetch Pexels pool for branche+cluster
  try {
    if (typeof fetchPexelsPool === "function" && !globalThis.__VFS_PEXELS_POOL) {
      const _branche = (typeof input === "object" && input && (input.branche || input.kunde_branche)) || (typeof branche !== "undefined" ? branche : "");
      const _cluster = (typeof input === "object" && input && (input.cluster || input.branche_cluster)) || (typeof cluster !== "undefined" ? cluster : "");
      globalThis.__VFS_PEXELS_POOL = await fetchPexelsPool(_branche, _cluster, 24);
      console.log("[Patch A2] Pexels pool ready:", (globalThis.__VFS_PEXELS_POOL || []).length);
    }
  } catch(e) { console.log("[Patch A2] pool fetch failed:", e.message); }
  const sys = 'Du bist Awwwards-Juror und Designresearcher. Recherchiere mit web_search Tool 5-8 Best-in-Class-Sites. Queries: "awwwards [branche] site of the day 2026", "[branche] editorial website award winning 2026". Direkte Besuche awwwards.com, fwa.com, cssdesignawards.com, siteinspire.com, godly.website, land-book.com. Plus 2-3 Lottie-Files. Plus Editorial-Typografie-Referenz. Am Ende JSON: {"best_in_class":[{"url":"","name":"","note":"","steal":""}],"fontshare_pairing":"primary + secondary","color_palette":{"primary":"#hex","accent":"#hex","dark":"#hex","light":"#hex","neutral":"#hex"},"lottie_files":["url1","url2"],"design_thesis_refined":"max 25 Worte"}.';
  const usr = 'Cluster: ' + cluster.cluster + ' (' + cluster.cluster_name + ')\nEditorial-Hebung: ' + cluster.editorial_hebung + '\nSignature-Effekt: ' + cluster.signature_name + '\nInitial Design-Thesis: ' + cluster.design_thesis + '\nRecherchiere 5-8 Best-in-Class + Fontshare-Pairing + erdige Color-Palette (Sage statt Gruen, Ochre statt Gelb, Bordeaux statt Rot, Anthrazit statt Schwarz, Off-White statt Weiss) + 2 Lottie-URLs.';
  const fallback = { best_in_class: [], fontshare_pairing: 'cabinet-grotesk + satoshi', color_palette: { primary: '#152518', accent: '#5a9468', dark: '#0a1410', light: '#f2f7f3', neutral: '#c98e6a' }, lottie_files: [], design_thesis_refined: cluster.design_thesis };
  let txt = '';
  try { txt = await llmWithSearch(sys, usr, 8); } catch (e) { console.log('[step2] llmWithSearch failed:', e.message); return fallback; }
  // V35.3: Robuster JSON-Parse mit balanced-brace + try/catch
  const mt = txt.match(/\{[\s\S]*\}/);
  if (!mt) { console.log('[step2] no JSON braces, fallback'); return fallback; }
  try {
    return JSON.parse(mt[0]);
  } catch (e) {
    // Repair-Versuch: trailing comma entfernen, dann erneut
    try {
      const repaired = mt[0]
        .replace(/,(\s*[}\]])/g, '$1')      // trailing commas
        .replace(/[“”]/g, '"')   // smart quotes → straight
        .replace(/[‘’]/g, "'");
      return JSON.parse(repaired);
    } catch (e2) {
      console.log('[step2] JSON.parse failed even after repair, fallback. Snippet:', mt[0].slice(0, 200));
      return fallback;
    }
  }
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

// ─── Anthropic Helper (V36.4: Auto-Streaming für lange Outputs) ─────
async function llm(model, system, user, maxTokens = 4000) {
  // V36.4: Streaming aktivieren für lange Outputs (>16k tokens) → robust gegen Connection-Drops
  if (maxTokens > 16000) {
    try {
      const stream = anthropic.messages.stream({
        model, max_tokens: maxTokens, system,
        messages: [{ role: 'user', content: user }],
      });
      // Optional: Streaming-Progress in Logs (alle 5k Tokens)
      let lastLog = 0;
      stream.on('text', (delta, snapshot) => {
        if (snapshot.length - lastLog > 5000) {
          console.log('[stream ' + model.slice(7, 13) + '] ' + snapshot.length + ' chars');
          lastLog = snapshot.length;
        }
      });
      const final = await stream.finalMessage();
      inputTokensTotal += final.usage.input_tokens;
      outputTokensTotal += final.usage.output_tokens;
      return final.content?.[0]?.text || '';
    } catch (e) {
      console.log('[llm-stream] error, fallback to .create():', e.message);
      // Fall-through zu non-streaming
    }
  }
  const res = await anthropic.messages.create({
    model, max_tokens: maxTokens, system,
    messages: [{ role: 'user', content: user }],
  });
  inputTokensTotal += res.usage.input_tokens;
  outputTokensTotal += res.usage.output_tokens;
  return res.content?.[0]?.text || '';
}

// ─── Code-Fence-Strip (LLM-Output Sanitization) ─────────────────


function postProcessUrls(html, pool) {
  if (!html || !pool || pool.length === 0) return html;
  let i = 0;
  let out = html;
  // 1) Cloudinary-fetch around URL-encoded unsplash
  out = out.replace(/https:\/\/res\.cloudinary\.com\/[^/]+\/image\/fetch\/[^"\s']*?https%3A%2F%2Fimages\.unsplash\.com%2F[^"\s')]+/gi, () => { const p = pool[i % pool.length]; i++; return p.url; });
  // 2) Cloudinary-fetch around plain unsplash
  out = out.replace(/https:\/\/res\.cloudinary\.com\/[^/]+\/image\/fetch\/[^"\s']*?https?:\/\/images\.unsplash\.com\/[^"\s')]+/gi, () => { const p = pool[i % pool.length]; i++; return p.url; });
  // 3) Plain unsplash
  out = out.replace(/https?:\/\/images\.unsplash\.com\/[^"\s')]+/gi, () => { const p = pool[i % pool.length]; i++; return p.url; });
  return out;
}
function stripCodeFence(s) {
  if (typeof s !== "string") return s;
  let out = s.replace(/^```(?:[a-zA-Z]+)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "").trim();
  if (out.startsWith("<!DOCTYPE") || out.startsWith("<html")) {
    // Auto-replace halucinated unsplash with pexels pool
    if (globalThis.__VFS_PEXELS_POOL && globalThis.__VFS_PEXELS_POOL.length) {
      out = postProcessUrls(out, globalThis.__VFS_PEXELS_POOL);
    }
    // Auto-fix Booking-CTAs
    out = out.replace(/<a([^>]*?)href=["']#["']([^>]*?)>([^<]*?(?:Termin|Buchen|Booking|buchen)[^<]*?)<\/a>/gi, '<a$1href="https://calendly.com/valentin-fischer/30min" target="_blank" rel="noopener"$2>$3</a>');
    // IntersectionObserver-Watchdog injizieren
    if (out.includes("</body>") && !out.includes("__VFS_FADE_WATCHDOG__")) {
      const wd = '<style id="__VFS_HEADER_FORCE__">header, .header, nav, .nav, .navbar, .site-header { position: sticky !important; top: 0 !important; z-index: 1000 !important; background: var(--header-bg, var(--bg, #fff)) !important; backdrop-filter: blur(8px); } header > *:first-child, .header > *:first-child { flex-shrink: 0; } header, .header, nav.main-nav, .navbar { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 2rem; padding-inline: 1.5rem; padding-block: 1rem; } @media (max-width: 768px) { header nav, .header nav, .navbar nav { display: none !important; } header .menu-toggle, .header .menu-toggle, .hamburger { display: inline-flex !important; } } [style*="opacity:0"], [style*="opacity: 0"] { opacity: 1 !important; transform: none !important; }<\/style><script id="__VFS_FADE_WATCHDOG__">(function(){function reveal(){var els=document.querySelectorAll("*");var fixed=0;for(var i=0;i<els.length;i++){var e=els[i];if(["SCRIPT","STYLE","LINK","META","HEAD","TITLE","NOSCRIPT"].indexOf(e.tagName)>-1)continue;var s=getComputedStyle(e);if(parseFloat(s.opacity)<0.1){e.style.setProperty("opacity","1","important");e.style.setProperty("transform","none","important");e.style.setProperty("visibility","visible","important");e.style.setProperty("transition","opacity 0.4s ease, transform 0.4s ease","important");fixed++;}}console.log("[VFS Watchdog] revealed",fixed,"hidden elements");}setTimeout(reveal,1200);setTimeout(reveal,3000);})();<\/script>';
      out = out.replace("</body>", wd + "</body>");
    }
  }
  return out;
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
  if (!url) return { title: '', description: '', images: [], imagesRich: [], textSnippets: [], ogImage: '', favicon: '' };
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });
    // V35.4: User-Agent setzen (Bot-Detection umgehen)
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'de-CH,de;q=0.9,en;q=0.8' });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25_000 }).catch(() => {});
    // V35.4: Cookie-Banner-Auto-Accept (Heuristik via Button-Text + Selector)
    try {
      await page.evaluate(() => {
        const accepts = ['Akzeptieren','Alle akzeptieren','Alle Cookies akzeptieren','Annehmen','Zustimmen','Verstanden','Verstanden!','OK','Akzeptiere','Accept','Accept all','Accept All','Allow all','Got it','I agree','Agree','Einverstanden'];
        const sels = ['button','a','[role="button"]','input[type="submit"]','input[type="button"]'];
        const accepted = [];
        for (const sel of sels) {
          for (const el of document.querySelectorAll(sel)) {
            const t = (el.innerText || el.textContent || el.value || '').trim();
            if (!t) continue;
            for (const a of accepts) {
              if (t.toLowerCase().includes(a.toLowerCase())) {
                try { el.click(); accepted.push(t.slice(0, 30)); break; } catch {}
              }
            }
          }
        }
        // ID/class-Pattern Backup
        const patterns = ['#cookie-accept','#accept-cookies','#accept-all','.cookie-accept','.accept-cookies','.consent-accept','[data-cookie-accept]','[onclick*="accept"]'];
        for (const sel of patterns) {
          const el = document.querySelector(sel);
          if (el) { try { el.click(); accepted.push('selector:' + sel); } catch {} }
        }
        return accepted;
      });
      await new Promise(r => setTimeout(r, 1200));
    } catch (_) {}
    // V35.2: Lazy-Load-Trigger — slow-scroll bottom + wait + scroll top
    try {
      await page.evaluate(async () => {
        await new Promise(resolve => {
          let total = 0; const step = 250;
          const t = setInterval(() => {
            window.scrollBy(0, step); total += step;
            if (total >= document.body.scrollHeight) { clearInterval(t); resolve(); }
          }, 80);
          setTimeout(() => { clearInterval(t); resolve(); }, 6000);
        });
      });
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 600));
    } catch (_) {}
    const data = await page.evaluate(() => {
      // V35.1: Rich image data with context, dims, alt
      const ctx = (el) => {
        let p = el.parentElement; let depth = 0;
        while (p && depth < 8) {
          const tag = p.tagName.toLowerCase();
          if (['header','nav','footer','aside','main','section','article','figure'].includes(tag)) return tag;
          const cls = (p.className || '').toString().toLowerCase();
          if (/(gallery|galerie|portfolio|projekte|werkstatt|praxis|behandlung|hero|team|crew|mitarbeiter)/.test(cls)) return 'gallery';
          if (/(header|navbar|nav-)/.test(cls)) return 'header';
          if (/(footer|bottom)/.test(cls)) return 'footer';
          p = p.parentElement; depth++;
        }
        return 'body';
      };
      // V35.3: srcset best-resolution + erweiterte data-* Fallbacks + URL-Resolution
      const pickBestUrl = (i) => {
        const srcset = i.srcset || i.getAttribute('data-srcset') || i.getAttribute('data-srcset-1x') || '';
        if (srcset) {
          const items = srcset.split(',').map(s => s.trim());
          let bestUrl = null, bestW = 0;
          for (const item of items) {
            const parts = item.split(/\s+/);
            const u = parts[0]; const w = parts[1] ? parseInt(parts[1].replace('w', ''), 10) : 0;
            if (w > bestW && u) { bestW = w; bestUrl = u; }
          }
          if (bestUrl) return { url: bestUrl, hintW: bestW };
        }
        // V35.3: lazy-load-Pattern erweitert
        const url = i.currentSrc
          || i.src
          || i.getAttribute('data-src')
          || i.getAttribute('data-lazy-src')
          || i.getAttribute('data-original')
          || i.getAttribute('data-original-src')
          || i.getAttribute('data-img')
          || i.getAttribute('data-pin-media')
          || i.getAttribute('data-srcset-1x')
          || '';
        return { url, hintW: 0 };
      };
      // V35.3: URL-Resolution: relative URLs zu absolute via new URL(...)
      const resolveUrl = (u) => {
        if (!u) return '';
        if (u.startsWith('data:')) return '';
        try {
          // Relative + absolute resolution (browser-native)
          return new URL(u, document.baseURI).href;
        } catch { return u; }
      };
      const imgsRich = Array.from(document.querySelectorAll('img'))
        .map(i => {
          const { url: rawUrl, hintW } = pickBestUrl(i);
          const url = resolveUrl(rawUrl);
          return { i, url, hintW };
        })
        .filter(x => x.url && /^https?:\/\//i.test(x.url))
        .slice(0, 50)
        .map(({ i, url, hintW }) => ({
          url,
          alt: (i.alt || '').slice(0, 120),
          w: i.naturalWidth || hintW || 0,
          h: i.naturalHeight || 0,
          ctx: ctx(i),
          cls: (i.className || '').toString().slice(0, 80),
          near_text: (i.parentElement?.innerText || '').slice(0, 80).trim(),
        }));
      // Plus background-image URLs in inline-styles (Hero-Backgrounds oft so)
      const bgRich = Array.from(document.querySelectorAll('[style*="background-image"]'))
        .slice(0, 12)
        .map(el => {
          const m = (el.getAttribute('style') || '').match(/url\(["']?([^"')]+)["']?\)/);
          if (!m) return null;
          return { url: m[1], alt: '', w: el.offsetWidth || 0, h: el.offsetHeight || 0, ctx: ctx(el), cls: 'bg-image', near_text: (el.innerText || '').slice(0, 80) };
        }).filter(Boolean);
      const allImgs = [...imgsRich, ...bgRich];
      const textSnippets = Array.from(document.querySelectorAll('h1, h2, h3, p'))
        .map(e => (e.innerText || '').trim()).filter(t => t.length > 20 && t.length < 400)
        .slice(0, 30);
      const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
      const favicon = (document.querySelector('link[rel*="icon"]:not([rel*="apple"])')?.href || '').replace(/^http:/, 'https:');
      const appleTouchIcon = (document.querySelector('link[rel*="apple-touch-icon"]')?.href || '').replace(/^http:/, 'https:');
      return {
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.content || '',
        ogImage,
        favicon,
        appleTouchIcon,
        images: allImgs.map(x => x.url),
        imagesRich: allImgs,
        headlines: Array.from(document.querySelectorAll('h1, h2')).map(e => (e.innerText || '').trim()).filter(Boolean).slice(0, 10),
        textSnippets,
      };
    });
    return data;
  } catch (e) {
    return { title: '', description: '', images: [], imagesRich: [], textSnippets: [], ogImage: '', favicon: '', error: String(e) };
  } finally {
    await browser.close();
  }
}

// V35.4: Raw-HTML-Fallback fuer imagesRich (wenn Puppeteer 0/wenige findet)
async function fetchRawHtmlImages(prospectUrl) {
  if (!prospectUrl) return [];
  try {
    const r = await fetch(prospectUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36', 'Accept-Language': 'de-CH,de;q=0.9' }, redirect: 'follow' });
    if (!r.ok) return [];
    const html = await r.text();
    const baseUrl = new URL(prospectUrl);
    const baseHref = baseUrl.origin;
    const resolveUrl = (u) => {
      if (!u) return '';
      if (u.startsWith('data:')) return '';
      if (u.startsWith('//')) return 'https:' + u;
      if (u.startsWith('/')) return baseHref + u;
      if (u.startsWith('http')) return u;
      try { return new URL(u, prospectUrl).href; } catch { return ''; }
    };
    const out = [];
    // 1. img src
    const imgSrcRe = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*?>/gi;
    let m;
    while ((m = imgSrcRe.exec(html)) !== null && out.length < 50) {
      const url = resolveUrl(m[1]);
      if (url && /^https?:\/\//i.test(url)) {
        const altMatch = m[0].match(/\balt\s*=\s*["']([^"']*)["']/i);
        const clsMatch = m[0].match(/\bclass\s*=\s*["']([^"']*)["']/i);
        out.push({ url, alt: (altMatch ? altMatch[1] : '').slice(0, 120), w: 0, h: 0, ctx: 'body', cls: (clsMatch ? clsMatch[1] : '').slice(0, 80), near_text: '' });
      }
    }
    // 2. data-src/data-lazy-src/data-original
    const dataSrcRe = /<img\b[^>]*?\b(?:data-src|data-lazy-src|data-original|data-img)\s*=\s*["']([^"']+)["'][^>]*?>/gi;
    while ((m = dataSrcRe.exec(html)) !== null && out.length < 60) {
      const url = resolveUrl(m[1]);
      if (url && /^https?:\/\//i.test(url) && !out.some(x => x.url === url)) {
        out.push({ url, alt: '', w: 0, h: 0, ctx: 'body', cls: 'lazy', near_text: '' });
      }
    }
    // 3. srcset best
    const srcsetRe = /srcset\s*=\s*["']([^"']+)["']/gi;
    while ((m = srcsetRe.exec(html)) !== null && out.length < 70) {
      const items = m[1].split(',').map(s => s.trim());
      let bestUrl = null, bestW = 0;
      for (const it of items) {
        const parts = it.split(/\s+/);
        const u = parts[0]; const w = parts[1] ? parseInt(parts[1].replace('w', ''), 10) : 0;
        if (w > bestW && u) { bestW = w; bestUrl = u; }
      }
      const url = resolveUrl(bestUrl);
      if (url && /^https?:\/\//i.test(url) && !out.some(x => x.url === url)) {
        out.push({ url, alt: '', w: bestW, h: 0, ctx: 'body', cls: 'srcset', near_text: '' });
      }
    }
    // 4. background-image inline-styles
    const bgRe = /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((m = bgRe.exec(html)) !== null && out.length < 80) {
      const url = resolveUrl(m[1]);
      if (url && /^https?:\/\//i.test(url) && !out.some(x => x.url === url)) {
        out.push({ url, alt: '', w: 0, h: 0, ctx: 'body', cls: 'bg-image', near_text: '' });
      }
    }
    // 5. og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) {
      const url = resolveUrl(ogMatch[1]);
      if (url && !out.some(x => x.url === url)) out.push({ url, alt: 'og:image', w: 0, h: 0, ctx: 'header', cls: 'og-image', near_text: '' });
    }
    return out;
  } catch (e) {
    console.log('[V35.4 raw-html-fallback]', e.message);
    return [];
  }
}

// V35.1 Quality-Gate: Score Prospect-Bilder + Role-Tagging ---------
function scoreProspectImages(imagesRich, branche) {
  if (!Array.isArray(imagesRich) || imagesRich.length === 0) return [];
  const branchKey = (branche || '').toLowerCase();
  const blacklist = /(logo|favicon|icon|sprite|placeholder|loading|tracking|pixel|spinner|whatsapp|facebook|instagram|twitter|linkedin|youtube|tiktok|xing|google|maps|cookie|gdpr|datenschutz|impressum|agb)/i;
  const galleryHint = /(gallery|galerie|portfolio|projekt|werkstatt|praxis|behandlung|raum|interior|atelier|studio|salon|kollektion|einblick)/i;
  const teamHint = /(team|crew|mitarbeiter|kolleg|stylist|therapeut|berater|portrait|portr%C3%A4t)/i;
  const heroHint = /(hero|header|banner|cover|main-image|full|wide|landing)/i;
  const out = [];
  // URL-Hint: Pfad-Zahlen (z.B. "1600x900" oder "_1200") als width-proxy
  const inferWidthFromUrl = (u) => {
    const m1 = u.match(/(\d{3,4})x(\d{3,4})/);
    if (m1) return parseInt(m1[1], 10);
    const m2 = u.match(/[_-](\d{3,4})(?:\.|_|x)/);
    if (m2) return parseInt(m2[1], 10);
    if (/(=w\d{3,4}|width=\d{3,4})/.test(u)) {
      const m3 = u.match(/(?:=w|width=)(\d{3,4})/); if (m3) return parseInt(m3[1], 10);
    }
    return 0;
  };
  for (const im of imagesRich) {
    if (!im.url || blacklist.test(im.url) || blacklist.test(im.cls || '') || blacklist.test(im.alt || '')) continue;
    let w = im.w || 0;
    if (w === 0) w = inferWidthFromUrl(im.url); // V35.2: URL-Hint statt 0-skip
    // Hard-skip nur wenn explizit klein
    if (w > 0 && w < 600) continue;
    let score = 0;
    if (w >= 1800) score += 40;
    else if (w >= 1400) score += 30;
    else if (w >= 1100) score += 20;
    else if (w >= 800) score += 12;
    else if (w >= 600) score += 6;
    else score += 4; // unknown size: tolerieren, score basiert auf Rest
    if (im.ctx === 'gallery' || galleryHint.test(im.cls || '') || galleryHint.test(im.url)) score += 25;
    if (im.ctx === 'header' || heroHint.test(im.cls || '') || heroHint.test(im.url)) score += 20;
    if (teamHint.test(im.cls || '') || teamHint.test(im.alt || '')) score += 15;
    if (branchKey && im.alt && im.alt.toLowerCase().includes(branchKey)) score += 12;
    if (im.near_text && im.near_text.length > 20) score += 5;
    // V35.2: jpg/webp/png im Pfad bevorzugen (echte Inhalts-Bilder)
    if (/\.(jpe?g|webp|png)(\?|$)/i.test(im.url)) score += 4;
    // Aspect-Ratio: sehr schmale (Slider/Banner) abwerten, sehr hohe ok
    if (im.w && im.h) {
      const ar = im.w / im.h;
      if (ar > 4 || ar < 0.3) score -= 20;
    }
    if (score < 8) continue; // V35.2: 10→8 (toleranter)
    let role = 'generic';
    if (im.ctx === 'header' || heroHint.test(im.cls || '') || heroHint.test(im.url)) role = 'hero';
    else if (im.ctx === 'gallery' || galleryHint.test(im.cls || '') || galleryHint.test(im.url)) role = 'gallery';
    else if (teamHint.test(im.cls || '') || teamHint.test(im.alt || '')) role = 'team';
    out.push({ url: im.url, alt: im.alt || '', w, h: im.h || 0, role, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}

// V35.2 Logo-Extraction — robuster (SVG, apple-touch, Markenname, Header-context)
function extractProspectLogo(scrape, companyName) {
  if (!scrape) return null;
  // 1. og:image, aber nur wenn nicht "preview" oder "share-image" (oft Hero-Banner statt Logo)
  if (scrape.ogImage && /\.(png|jpe?g|webp|svg)/i.test(scrape.ogImage) && !/(preview|share|cover|hero|banner)/i.test(scrape.ogImage)) {
    return { url: scrape.ogImage, source: 'og:image' };
  }
  // 2. Logo-Pattern in URL/class/alt — V35.3: 2-Stufig (header-context BEVORZUGT, sonst body-fallback)
  const logoRx = /(logo|brand|wordmark|marke|firmenzeichen|signet|emblem|kln-logo|brand-mark)/i;
  const headerLogo = (scrape.imagesRich || []).find(i =>
    i.ctx === 'header' && (logoRx.test(i.url) || logoRx.test(i.cls || '') || logoRx.test(i.alt || ''))
  );
  if (headerLogo) return { url: headerLogo.url, source: 'header-logo-class' };
  // 2b. Body-Fallback: Pattern allein (z.B. Logo im Footer als Fallback)
  const anyLogo = (scrape.imagesRich || []).find(i =>
    logoRx.test(i.url) || logoRx.test(i.cls || '') || logoRx.test(i.alt || '')
  );
  if (anyLogo) return { url: anyLogo.url, source: 'body-logo-class' };
  // 3. Markenname als Pattern (companyName z.B. "silea" → suche "silea" im URL/alt)
  if (companyName) {
    const ck = companyName.toLowerCase().replace(/\s+/g, '');
    const brandLogo = (scrape.imagesRich || []).find(i =>
      i.ctx === 'header' && (i.url.toLowerCase().includes(ck) || (i.alt || '').toLowerCase().includes(ck))
    );
    if (brandLogo) return { url: brandLogo.url, source: 'brand-name' };
  }
  // 4. Erstes Bild im Header (klein-bis-mittel, oft Logo ohne explizite class)
  const firstHeader = (scrape.imagesRich || []).find(i => i.ctx === 'header' && i.w >= 80 && i.w <= 400);
  if (firstHeader) return { url: firstHeader.url, source: 'header-first' };
  // 5. apple-touch-icon (typisch 180x180 oder 192x192)
  if (scrape.appleTouchIcon) return { url: scrape.appleTouchIcon, source: 'apple-touch-icon' };
  // 6. Favicon (last resort)
  if (scrape.favicon && !/\/favicon\.ico$/i.test(scrape.favicon)) {
    return { url: scrape.favicon, source: 'favicon' };
  }
  return null;
}

// V35.1 Image-Validation (HEAD + Cloudinary-Wrap-Test) ----------------
async function validateImageHead(url, timeoutMs = 5000) {
  if (!url) return false;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const r = await fetch(url, { method: 'HEAD', signal: ctl.signal, redirect: 'follow' });
    clearTimeout(t);
    if (!r.ok) return false;
    const ct = r.headers.get('content-type') || '';
    return ct.startsWith('image/');
  } catch { return false; }
}

async function filterValidImages(scoredPool, maxParallel = 6) {
  const results = [];
  for (let i = 0; i < scoredPool.length; i += maxParallel) {
    const batch = scoredPool.slice(i, i + maxParallel);
    const checks = await Promise.all(batch.map(async im => ({ ok: await validateImageHead(im.url), im })));
    for (const c of checks) if (c.ok) results.push(c.im);
  }
  return results;
}

// V35.1 AI-Image-Generation via Replicate Flux-Schnell (graceful skip wenn kein Token)
async function generateAiImage(promptText, palette, aspect = '16:9', timeoutMs = 60_000) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) return null;
  try {
    const fullPrompt = `${promptText}. Professional editorial photography. Color palette: primary ${palette.primary}, accent ${palette.accent}. Soft natural light, no people looking at camera, no text, no logos. Premium swiss quality.`;
    const create = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json', Prefer: 'wait' },
      body: JSON.stringify({ input: { prompt: fullPrompt, aspect_ratio: aspect, output_format: 'webp', output_quality: 88, num_outputs: 1 } }),
    });
    if (!create.ok) { console.log('[V35.1 AI-Gen] create failed:', create.status); return null; }
    const data = await create.json();
    let url = null;
    if (Array.isArray(data.output) && data.output.length) url = data.output[0];
    else if (typeof data.output === 'string') url = data.output;
    if (!url && data.urls?.get) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeoutMs) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` } });
        if (!poll.ok) break;
        const pd = await poll.json();
        if (pd.status === 'succeeded' && pd.output) {
          url = Array.isArray(pd.output) ? pd.output[0] : pd.output;
          break;
        }
        if (pd.status === 'failed' || pd.status === 'canceled') break;
      }
    }
    return url || null;
  } catch (e) {
    console.log('[V35.1 AI-Gen] exception:', e.message);
    return null;
  }
}

// V35.1 Image-Pool-Builder mit 3-Tier-Hierarchie ---------------------
function buildHybridPoolPrompt({ logo, authentic, stock, ai }) {
  const lines = [];
  lines.push('\n\n=== BILDER-POOLS (PFLICHT-AUSWAHL nach Hierarchie) ===\n');
  lines.push('PRIORISIERUNGS-HIERARCHIE: AUTHENTIC (vom Kunden) > STOCK (Pexels) > AI (generiert).');
  lines.push('Authentic-Pool BEVORZUGT fuer Header-Logo, Hero, Galerie, Team. Stock-Pool fuer Service-Cards + Avatars + Generic. AI-Pool nur wenn die anderen leer/unpassend.\n');
  if (logo && logo.url) {
    lines.push(`-- HEADER-LOGO (Pflicht im Header, Source: ${logo.source}) --`);
    lines.push(`[LOGO] ${logo.url}\n`);
  } else {
    lines.push(`-- HEADER-LOGO --`);
    lines.push(`(kein Logo gefunden; verwende Wordmark in Display-Font mit primary-Color als Logo-Ersatz)\n`);
  }
  if (authentic && authentic.length) {
    lines.push(`-- AUTHENTIC POOL (vom Kunden, ${authentic.length} Bilder) --`);
    authentic.forEach((im, i) => {
      lines.push(`[AUTH_${i + 1}] role=${im.role} ${im.w}x${im.h} ${im.url} alt="${(im.alt || '').slice(0, 60)}"`);
    });
    lines.push(``);
  } else {
    lines.push(`-- AUTHENTIC POOL --`);
    lines.push(`(keine Quality-passenden Prospect-Bilder gefunden; Hero+Galerie aus STOCK oder AI)\n`);
  }
  if (stock && stock.length) {
    lines.push(`-- STOCK POOL (Pexels, ${stock.length} Bilder) --`);
    stock.slice(0, 18).forEach((p, i) => {
      lines.push(`[STOCK_${i + 1}] ${p.url} alt="${(p.alt || '').slice(0, 60)}"`);
    });
    lines.push(``);
  }
  if (ai && ai.length) {
    lines.push(`-- AI-GENERATED POOL (${ai.length} Bilder, branche+palette-spezifisch) --`);
    ai.forEach((u, i) => {
      lines.push(`[AI_${i + 1}] ${u.url} role=${u.role} prompt="${(u.prompt || '').slice(0, 80)}"`);
    });
    lines.push(``);
  }
  // V35.3: Sektion-Mapping (klare Hierarchie pro Sektion, NICHT pauschal)
  const hasAuthHero = (authentic || []).some(x => x.role === 'hero');
  const hasAuthGallery = (authentic || []).filter(x => x.role === 'gallery').length;
  const hasAuthTeam = (authentic || []).some(x => x.role === 'team');
  const hasAiHero = (ai || []).some(x => x.role === 'hero');
  const hasAiGallery = (ai || []).some(x => x.role === 'gallery');
  lines.push('SEKTION-MAPPING (Pflicht-Reihenfolge je Sektion):');
  lines.push(`- Header-Logo: ${logo && logo.url ? 'LOGO-Slot oben verwenden' : 'KEIN Logo gefunden -> Wordmark der Firma in Display-Font mit primary-Color (NICHT Stock-Bild als Logo)'}`);
  if (hasAuthHero) lines.push('- Hero: PFLICHT erste AUTHENTIC role=hero (kein Stock-Hero erlaubt)');
  else if (hasAiHero) {
    const aiHeroUrl = (ai || []).find(x => x.role === 'hero')?.url || '';
    lines.push('- Hero: PFLICHT [AI_1]-URL als Hero-Bild verwenden (' + aiHeroUrl.slice(0, 80) + '). AI-Bild ist mit deiner Profile-Palette und Branche generiert. KEIN Stock-Bild als Hero erlaubt. Beispiel-Markup: <img src="' + aiHeroUrl + '" alt="..." class="hero-image">');
  }
  else lines.push('- Hero: STOCK aus den ersten 3-5 Pool-Eintraegen');
  if (hasAuthGallery >= 3) lines.push('- Galerie: AUTHENTIC role=gallery (mind. 3-4 Bilder, Bento-Grid)');
  else if (hasAuthGallery >= 1 && hasAiGallery) lines.push('- Galerie: AUTHENTIC role=gallery + AI role=gallery kombinieren (Bento)');
  else if (hasAiGallery) {
    const aiGalUrl = (ai || []).find(x => x.role === 'gallery')?.url || '';
    lines.push('- Galerie: PFLICHT [AI_2]-URL einbinden (' + aiGalUrl.slice(0, 80) + ') + Stock als Fueller. AI-Bild zuerst.');
  }
  else lines.push('- Galerie: STOCK aus Pool, mind. 4-6 Bilder, Bento-Grid mit Variable-Hoehen');
  lines.push('- Leistungen-Cards: STOCK Pool (eines pro Card)');
  lines.push(`- Team-Cards: ${hasAuthTeam ? 'AUTHENTIC role=team (echte Teammitglieder)' : 'STOCK Portrait-Bilder als Placeholder'}`);
  lines.push('- Reviews-Avatars: STOCK Pool oder Initial-Bubbles (Buchstaben in primary-Color)');
  lines.push('- Standort: keine Bilder noetig (Maps-iframe + Adress-Text)');
  lines.push('- FAQ + Footer: keine Bilder');
  lines.push('');
  lines.push('REGELN:');
  lines.push('1. Verwende AUSSCHLIESSLICH URLs aus diesen Pools. KEINE images.unsplash.com erfinden. KEIN Cloudinary-Fetch-Wrap.');
  lines.push('2. Wenn Authentic-Pool ein role=hero/gallery/team hat, ZUERST das verwenden (Authentizitaet).');
  lines.push('3. Wenn Authentic fehlt aber AI-Pool das role hat: AI vor Stock einsetzen (AI ist branche+palette-spezifisch generiert).');
  lines.push('4. Stock nur als Fallback ODER fuer Sektionen wo wir explizit Stock vorschreiben (Service-Cards, Avatars).');
  lines.push('5. Wenn kein Logo-Slot: Wordmark der Firma in Display-Font mit primary-Color statt img - NIEMALS Stock-Bild als Logo.');
  lines.push('=== END BILDER-POOLS ===\n');
  return lines.join('\n');
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
  return `https://vf-services-mockups.netlify.app/${slug}/`;
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

// ─── V35.5 Patch B: Visual-Verify (Puppeteer-Screenshot + 5 Persona-Reviews mit Image-Input) ───
async function screenshotPreview(previewUrl, viewport) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    await page.setViewport(viewport);
    await page.goto(previewUrl, { waitUntil: 'networkidle2', timeout: 30_000 }).catch(() => {});
    // Allow scroll-triggered animations to finish + lazy-load
    await page.evaluate(async () => {
      await new Promise(r => {
        let total = 0; const t = setInterval(() => {
          window.scrollBy(0, 400); total += 400;
          if (total >= document.body.scrollHeight) { clearInterval(t); r(); }
        }, 60);
        setTimeout(() => { clearInterval(t); r(); }, 4000);
      });
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 600));
    const buf = await page.screenshot({ type: 'jpeg', quality: 75, fullPage: true });
    return buf.toString('base64');
  } catch (e) {
    console.log('[V35.5 screenshot]', e.message);
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

async function visualVerify(previewUrl, profile, prospect) {
  console.log('V35.5 STEP B Visual-Verify start');
  const desktopShot = await screenshotPreview(previewUrl, { width: 1440, height: 900 });
  const mobileShot = await screenshotPreview(previewUrl, { width: 380, height: 812, isMobile: true });
  if (!desktopShot && !mobileShot) {
    console.log('  both screenshots failed, skip visual-verify');
    return { total: null, passes: {}, notes: 'screenshots-failed' };
  }
  console.log('  screenshots ok desktop=' + (desktopShot ? Math.round(desktopShot.length/1024) + 'kb' : 'fail') + ' mobile=' + (mobileShot ? Math.round(mobileShot.length/1024) + 'kb' : 'fail'));

  // V36.3 Sonnet-Hybrid: 3 Sonnet (visual_design, typo_hierarchy, brand_coherence) + 2 Haiku (mobile_ux, cta_visibility) + 1 Specialist
  const passes = {
    pass1_visual_design: { model: 'claude-sonnet-4-6', sys: 'Du bist Senior Webdesigner mit Awwwards-Erfahrung. Bewerte Layout/Hierarchie/Whitespace/Hero-Wow-Moment/Bento-Grid/asymm-Splits 60-40 oder 70-30 (NICHT 50-50)/Sticky-Side-Caption/Marquee-Ribbon/Vertical-Eyebrow. Premium-KMU-Anspruch. Score 0-30. JSON: {"score":n,"notes":"..."}', max: 30, image: desktopShot },
    pass2_mobile_ux: { model: 'claude-haiku-4-5-20251001', sys: 'Du bist Mobile-UX-Experte. Bewerte Mobile-380px-Layout: Touch-Targets >=48px, Hamburger-Nav, Sticky-CTA-Bar bottom-fixed, Service-Cards stapelbar, Hero-Stats-Scroll, Chatbot-FAB klickbar (default-closed). Score 0-25. JSON: {"score":n,"notes":"..."}', max: 25, image: mobileShot },
    pass3_typo_hierarchy: { model: 'claude-sonnet-4-6', sys: 'Du bist Typografie-Experte. Bewerte Display-Font/Body-Font-Pairing (' + (profile.fontshare_pairing || 'erode + satoshi') + '), H1-clamp 3.2-6.8rem mit letter-spacing -0.03em, Variable-Font-Reveal-Animation, Eyebrow-Letterspacing 0.18em uppercase, Italic-Quotes, Typing-Hero-Effekt. Score 0-20. JSON: {"score":n,"notes":"..."}', max: 20, image: desktopShot },
    pass4_cta_visibility: { model: 'claude-haiku-4-5-20251001', sys: 'Du bist Conversion-Experte. Bewerte Termin-Buttons (sichtbar oben+unten? Calendly-Link? primary-color? btn-magnetic-Klasse?), Booking-Sektion mit 3-Step-State-Machine, Chatbot-FAB initial geschlossen aber klickbar. Score 0-15. JSON: {"score":n,"notes":"..."}', max: 15, image: desktopShot },
    pass5_brand_coherence: { model: 'claude-sonnet-4-6', sys: 'Du bist Brand-Designer. Bewerte ob Profile-Palette (' + profile.palette.primary + '/' + profile.palette.accent + '/' + profile.palette.dark + ') konsistent durchgezogen ist + Layout-DNA: ' + profile.layout_dna.slice(0, 100) + ' + Image-Treatment: ' + (profile.treatment || '').slice(0, 80) + '. Score 0-10. JSON: {"score":n,"notes":"..."}', max: 10, image: desktopShot },
    pass6_branche_specialist: { model: 'claude-sonnet-4-6', sys: 'Du bist Kunde aus der Branche ' + (prospect.branche || 'KMU') + '. Wuerdest du auf dieser Website einen Termin buchen? Bewerte Vertrauen, Klarheit der Leistungen, Professionalitaet. Score 0-10. JSON: {"score":n,"notes":"..."}', max: 10, image: desktopShot },
  };

  const results = { total: 0, passes: {}, notes: [] };
  let totalScore = 0; let totalMax = 0;
  for (const [key, cfg] of Object.entries(passes)) {
    if (!cfg.image) { results.passes[key] = `n/a (no-shot)/${cfg.max}`; totalMax += cfg.max; continue; }
    try {
      const res = await anthropic.messages.create({
        model: cfg.model || 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: cfg.sys + ' Antworte NUR mit JSON, keine Erklaerung davor/danach.',
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: cfg.image } },
            { type: 'text', text: 'Firma: ' + prospect.company + ' / Branche: ' + prospect.branche + '. Bewerte den Screenshot.' },
          ],
        }],
      });
      inputTokensTotal += res.usage.input_tokens; outputTokensTotal += res.usage.output_tokens;
      const txt = res.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') || '';
      const m = txt.match(/\{[\s\S]*\}/);
      let parsed = { score: 0, notes: 'parse-fail' };
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch {
          try { parsed = JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')); } catch {}
        }
      }
      const sc = Math.max(0, Math.min(cfg.max, parseInt(parsed.score, 10) || 0));
      results.passes[key] = sc + '/' + cfg.max;
      totalScore += sc; totalMax += cfg.max;
      if (parsed.notes) results.notes.push(key + ': ' + parsed.notes.slice(0, 200));
    } catch (e) {
      results.passes[key] = 'err/' + cfg.max;
      totalMax += cfg.max;
    }
  }
  results.total = totalScore;
  results.max = totalMax;
  console.log('  visual-verify total: ' + totalScore + '/' + totalMax);
  return results;
}

// V35.5 Patch C: Iter-Loop (Auto-Iteration wenn Score unter Threshold) ─────
async function buildIteration(sys, usr, html, verifyResult, profile) {
  // Build erweiterten User-Prompt mit Verify-Notes als Feedback
  const noteBlock = (verifyResult.notes || []).slice(0, 5).join('\n- ');
  const iterUsr = usr + '\n\n=== ITER-FEEDBACK ===\nDie erste Version hatte Score ' + verifyResult.total + '/' + verifyResult.max + '. Verbessere folgende Punkte konkret:\n- ' + noteBlock + '\n=== END FEEDBACK ===\n\nBaue HTML neu mit DENSELBEN Pflicht-Direktiven aber adressiere die Iter-Feedback-Punkte. Output: NUR komplettes HTML ab <!DOCTYPE html>.';
  const html2 = stripCodeFence(await llm('claude-sonnet-4-6', sys, iterUsr, 48000));
  return html2.startsWith('<!DOCTYPE') ? html2 : '<!DOCTYPE html>\n' + html2;
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

  // V35: Branche-Sub-Profile-Lookup + Master-Prompt-Builder (2026-05-06)
  const profile = lookupProfile(branche, cluster.cluster);

  // === V35.1+: Hybrid-Image-Pool (Authentic > Stock > AI) ===
  console.log('V35.4 STEP 3.5 Hybrid-Pool-Init');
  // V35.4: Raw-HTML-Fallback wenn Puppeteer 0/wenige Bilder findet
  let workingImagesRich = scrape.imagesRich || [];
  console.log('  puppeteer imagesRich.length: ' + workingImagesRich.length);
  if (workingImagesRich.length < 3 && prospectUrl) {
    console.log('  ↪ trigger raw-html-fallback (Puppeteer findet <3 Bilder)');
    const rawFallback = await fetchRawHtmlImages(prospectUrl);
    console.log('  ↪ raw-html-fallback found: ' + rawFallback.length);
    // Merge: bevorzuge Puppeteer-Daten falls vorhanden, sonst raw-html
    const seen = new Set(workingImagesRich.map(x => x.url));
    for (const im of rawFallback) {
      if (!seen.has(im.url)) {
        workingImagesRich.push(im);
        seen.add(im.url);
      }
    }
    scrape.imagesRich = workingImagesRich;
    // Auch og:image / favicon mergen falls noch leer
    if (!scrape.ogImage && rawFallback.find(x => x.cls === 'og-image')) {
      scrape.ogImage = rawFallback.find(x => x.cls === 'og-image').url;
    }
  }
  console.log('  total imagesRich after fallback: ' + workingImagesRich.length);
  for (let di = 0; di < Math.min(workingImagesRich.length, 5); di++) {
    const im = workingImagesRich[di];
    console.log('    [' + di + '] ctx=' + im.ctx + ' w=' + im.w + ' cls=' + (im.cls || '').slice(0, 30) + ' url=' + (im.url || '').slice(0, 80));
  }
  // 1. Logo-Extraction (V35.2: companyName Hint mitgeben)
  const logo = extractProspectLogo(scrape, company);
  if (logo) {
    const logoOk = await validateImageHead(logo.url);
    globalThis.__VFS_LOGO = logoOk ? { url: cld(logo.url, 600), source: logo.source } : null;
    console.log('  logo=' + (logoOk ? 'ok' : 'failed') + ' source=' + logo.source);
  } else {
    globalThis.__VFS_LOGO = null;
    console.log('  logo=none-found');
  }
  // 2. Authentic-Pool (Quality-Gate + Validation)
  const scoredAuth = scoreProspectImages(scrape.imagesRich || [], branche);
  console.log('  scored authentic candidates: ' + scoredAuth.length);
  const validAuth = await filterValidImages(scoredAuth, 6);
  // Cloudinary-Wrap fuer Authentic (Hotlink-Schutz loesen)
  globalThis.__VFS_AUTHENTIC_POOL = validAuth.slice(0, 10).map(im => ({
    url: cld(im.url, im.role === 'hero' ? 2400 : 1600),
    alt: im.alt,
    w: im.w, h: im.h,
    role: im.role,
    score: im.score,
  }));
  console.log('  authentic-pool validated: ' + globalThis.__VFS_AUTHENTIC_POOL.length + ' (roles: ' + globalThis.__VFS_AUTHENTIC_POOL.map(x => x.role).join(',') + ')');
  // 3. AI-Gen-Trigger nur bei Lücken: kein Hero in Authentic + Pexels generic + REPLICATE_API_TOKEN gesetzt
  const REPLICATE_TOKEN_SET = !!process.env.REPLICATE_API_TOKEN;
  globalThis.__VFS_AI_POOL = [];
  if (REPLICATE_TOKEN_SET) {
    const hasAuthHero = globalThis.__VFS_AUTHENTIC_POOL.some(x => x.role === 'hero' && x.w >= 1400);
    const heroNeedsAi = !hasAuthHero;
    const galleryNeedsAi = globalThis.__VFS_AUTHENTIC_POOL.filter(x => x.role === 'gallery').length < 3;
    const aiTargets = [];
    if (heroNeedsAi) aiTargets.push({ role: 'hero', aspect: '16:9', prompt: `Editorial hero for ${profile.cluster_name} ${branche}: ${profile.image_mood}` });
    if (galleryNeedsAi && aiTargets.length < 2) aiTargets.push({ role: 'gallery', aspect: '4:5', prompt: `Detail close-up for ${branche}: ${profile.image_mood.split(',')[0]}` });
    console.log('  ai-targets: ' + aiTargets.length + ' (heroNeed=' + heroNeedsAi + ' galleryNeed=' + galleryNeedsAi + ')');
    for (let ti = 0; ti < Math.min(aiTargets.length, 2); ti++) {
      const t = aiTargets[ti];
      if (ti > 0) {
        // V35.3: 3s Sleep zwischen Calls (Rate-Limit-Schutz nach 429-Bug)
        await new Promise(r => setTimeout(r, 3000));
      }
      const aiUrl = await generateAiImage(t.prompt, profile.palette, t.aspect, 60_000);
      if (aiUrl) {
        globalThis.__VFS_AI_POOL.push({ url: aiUrl, role: t.role, prompt: t.prompt });
        console.log('  ai-gen ok role=' + t.role + ' url=' + aiUrl.slice(0, 60));
      } else {
        console.log('  ai-gen failed role=' + t.role);
      }
    }
  } else {
    console.log('  ai-gen skipped (REPLICATE_API_TOKEN not set)');
  }
  // === END V35.1 Hybrid-Pool-Init ===

  console.log('STEP 4 V35-Prompt: profile=' + profile.slug + ' sig=' + profile.signature_name + ' pal=' + profile.palette.primary + '/' + profile.palette.accent);
  const sys = buildV35SystemPrompt(profile, MOCKUP_ID, VFS_SUPABASE_URL);
  const usr = `Firma: ${company}\nBranche: ${branche}\nSub-Profile: ${profile.slug} (${profile.cluster_name})\nProspect-URL: ${prospectUrl}\nReply-Signal: ${m.signal || ''}\n\nProfile-Voice: ${profile.voice}\nProfile-Layout-DNA: ${profile.layout_dna}\nProfile-Image-Mood: ${profile.image_mood}\nProfile-Hero-Pattern: ${profile.hero_pattern}\nProfile-Cert-Badges: ${profile.badges.join(' | ')}\n\nCurated Hero-Image: ${curated.hero_image}\nCurated Section-Images: ${(curated.section_images || []).slice(0,8).join(', ')}\nCurated Team-Avatars: ${(curated.team_avatars || []).join(', ')}\n\nGescrapte Site-Daten (Inspiration fuer lokal-konkrete Inhalte):\nTitle: ${scrape.title}\nDesc: ${scrape.description}\nText-Snippets:\n${(scrape.textSnippets||[]).slice(0,12).join('\n')}\n\nAUFGABE: Baue index.html komplett. 9 Pflicht-Sektionen + Footer in der vorgegebenen Reihenfolge. Profile-Color-Palette (genau diese 5 Hex) sind die Pflicht-Tokens. Layout-DNA + Hero-Pattern + 5 Layout-Muster (mind. 4 von 5) konsequent umsetzen. Voice-Verben aus Profile mind. 4 verschiedene einsetzen. Mind. 3x lokaler Bezug auf Stadt/Quartier/Region. Forbidden-Words HARD-STOP. Output: pures HTML ab <!DOCTYPE html>.`;
  // V36.4: 2-Variants generieren SEQUENZIELL (statt parallel) + Winner-Pick via Sonnet
  console.log('STEP 5 V36.4 2-Variants Sequenziell HTML-Gen + Winner-Pick');
  const variantUsrA = usr + '\n\nVARIANT-DIREKTIVE: Editorial-Magazin-Stil. Asymm-Splits 70/30. Hero mit grosser Italic-Quote.';
  const variantUsrB = usr + '\n\nVARIANT-DIREKTIVE: Premium-Brand-Stil. Center-Stage-Hero. Mehr Whitespace. Marquee-Ribbon.';
  let htmlA = null, htmlB = null;
  console.log('  → Variant A starting (streaming)...');
  try { htmlA = stripCodeFence(await llm('claude-sonnet-4-6', sys, variantUsrA, 48000)); console.log('  ✓ Variant A: ' + (htmlA?.length || 0) + ' chars'); } catch (e) { console.log('  ✗ Variant A failed: ' + e.message); }
  await new Promise(r => setTimeout(r, 3000)); // 3s sleep zwischen Variants (Rate-Limit-Schutz)
  console.log('  → Variant B starting (streaming)...');
  try { htmlB = stripCodeFence(await llm('claude-sonnet-4-6', sys, variantUsrB, 48000)); console.log('  ✓ Variant B: ' + (htmlB?.length || 0) + ' chars'); } catch (e) { console.log('  ✗ Variant B failed: ' + e.message); }
  let html;
  if (htmlA && htmlB) {
    // Sonnet pickt Winner basierend auf Profile-Fit
    try {
      const pickRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 200,
        system: 'Du bist Senior Webdesigner. Bewerte 2 HTML-Varianten fuer Schweizer KMU-Mockup nach Layout-DNA-Match (' + profile.layout_dna.slice(0, 100) + ') + Premium-Wirkung. Antworte NUR mit JSON: {"winner":"A"|"B","reason":"..."}',
        messages: [{ role: 'user', content: 'Variant A (' + htmlA.length + ' chars):\n' + htmlA.slice(0, 4000) + '\n\nVariant B (' + htmlB.length + ' chars):\n' + htmlB.slice(0, 4000) + '\n\nWelche passt besser zum Profile ' + profile.slug + '?' }],
      });
      inputTokensTotal += pickRes.usage.input_tokens; outputTokensTotal += pickRes.usage.output_tokens;
      const pickTxt = pickRes.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') || '';
      const m = pickTxt.match(/\{[\s\S]*\}/);
      const winner = m ? (JSON.parse(m[0]).winner || 'A') : 'A';
      html = winner.toUpperCase().includes('B') ? htmlB : htmlA;
      console.log('  variant-winner: ' + winner + ' (A: ' + htmlA.length + ' chars, B: ' + htmlB.length + ')');
    } catch (e) {
      html = htmlA.length >= htmlB.length ? htmlA : htmlB;
      console.log('  pick-fail, longer-wins: ' + (html === htmlA ? 'A' : 'B'));
    }
  } else {
    html = htmlA || htmlB || '';
    console.log('  only one variant succeeded');
  }
  if (!html) {
    // Fallback: Single-Variant-Generation
    html = stripCodeFence(await llm('claude-sonnet-4-6', sys, usr, 48000));
  }
  const finalHtml = html.startsWith('<!DOCTYPE') ? html : `<!DOCTYPE html>\n${html}`;

  // Seite 2 (vereinfachte Variante)
  const seite2Sys = `${sys}\nFuer Seite 2: branchen-spezifische Unterseite (Leistungen/Team/Portfolio). Selbe Navigation/Footer wie Home.`;
  const seite2 = stripCodeFence(await llm('claude-sonnet-4-6', seite2Sys, usr + '\n\nAufgabe: Seite 2.', 18000));
  const seite2Html = seite2.startsWith('<!DOCTYPE') ? seite2 : `<!DOCTYPE html>\n${seite2}`;

  // Deploy
  console.log(`Deploy slug=${slug}`);
  const previewUrl = await netlifyDeploy(slug, { 'index.html': finalHtml, 'seite2.html': seite2Html });
  await patchPending(MOCKUP_ID, { build_status: 'deployed', preview_url: previewUrl, preview_url_seite2: previewUrl + 'seite2.html' });

  // V35.5 Patch B: Visual-Verify + Patch C: Iter-Loop (laufen AUCH bei REDEPLOY_ONLY damit Test-Builds Score sehen)
  let visualResult = await visualVerify(previewUrl, profile, { company, branche });
  let iterCount = 0;
  const ITER_THRESHOLD = 75;
  const ITER_MAX = 2; // V36.3: 1->2 (Premium-Polish-Tier, mehr Polish-Chancen)
  let currentHtml = finalHtml;
  while (visualResult.total !== null && visualResult.total < ITER_THRESHOLD && iterCount < ITER_MAX) {
    iterCount++;
    console.log('V35.5 STEP C Iter ' + iterCount + ' (score ' + visualResult.total + ' < ' + ITER_THRESHOLD + ')');
    try {
      const newHtml = await buildIteration(sys, usr, currentHtml, visualResult, profile);
      currentHtml = newHtml;
      // Re-deploy auf gleichen slug
      const newPreviewUrl = await netlifyDeploy(slug, { 'index.html': currentHtml, 'seite2.html': seite2Html });
      console.log('  iter-redeploy ok: ' + newPreviewUrl);
      // Re-screenshot + re-verify
      visualResult = await visualVerify(newPreviewUrl, profile, { company, branche });
      console.log('  iter ' + iterCount + ' new score: ' + visualResult.total);
    } catch (e) {
      console.log('  iter ' + iterCount + ' failed: ' + e.message);
      break;
    }
  }
  if (visualResult.total !== null && visualResult.total < ITER_THRESHOLD) {
    console.log('V35.5 Visual-Verify: nach ' + iterCount + ' Iter immer noch unter Threshold (' + visualResult.total + '/' + visualResult.max + '). Slack-Alert.');
    if (SLACK_ALERTS_WEBHOOK) {
      await fetch(SLACK_ALERTS_WEBHOOK, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: ':warning: Mockup ' + company + ' (' + slug + ') unter Visual-Threshold nach ' + iterCount + ' Iter. Score: ' + visualResult.total + '/' + visualResult.max + ' Preview: ' + previewUrl }) }).catch(()=>{});
    }
  }

  // REDEPLOY_ONLY-Modus: nach Visual-Verify+Iter abbrechen ohne Lighthouse/Mail/Send
  if (m.build_status === 'redeploy_only') {
    const _visualPasses = {};
    _visualPasses.visual_verify_total = visualResult.total !== null ? (visualResult.total + '/' + visualResult.max) : 'n/a';
    for (const [k, v] of Object.entries(visualResult.passes || {})) _visualPasses['visual_' + k] = v;
    _visualPasses.iter_count = iterCount;
    console.log('REDEPLOY_ONLY: skip lighthouse/runPasses/mail/send, save Visual-Verify');
    await patchPending(MOCKUP_ID, {
      build_status: 'redeployed',
      signal: 'redeploy_only_completed_with_visual_verify',
      preview_url: previewUrl,
      preview_url_seite2: previewUrl + 'seite2.html',
      branche_cluster: profile.slug,
      signature_effect: profile.signature_name,
      design_thesis: 'V35.5 Hybrid-Pool (REDEPLOY_ONLY): ' + profile.slug + ' / auth=' + ((globalThis.__VFS_AUTHENTIC_POOL || []).length) + ' stock=' + ((globalThis.__VFS_PEXELS_POOL || []).length) + ' ai=' + ((globalThis.__VFS_AI_POOL || []).length) + ' logo=' + (globalThis.__VFS_LOGO ? globalThis.__VFS_LOGO.source : 'none') + ' / visual=' + (visualResult.total || 'n/a') + '/' + (visualResult.max || '?') + ' iter=' + iterCount,
      prompt_version: 'v35_5_visual_verify_iter_2026-05-06',
      pass_scores: _visualPasses,
    });
    if (SLACK_ALERTS_WEBHOOK) {
      await fetch(SLACK_ALERTS_WEBHOOK, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: ':wrench: Redeploy-only fertig: ' + previewUrl + ' | visual=' + (visualResult.total || 'n/a') + '/' + (visualResult.max || '?') + ' iter=' + iterCount }) }).catch(()=>{});
    }
    return;
  }

  // Lighthouse
  console.log('Run Lighthouse');
  const lh = await runLighthouse(previewUrl);

  // 5 Persona-Passes (HTML-basiert, ergaenzend zum visualVerify)
  console.log('Run 5 passes');
  const passes = await runPasses(currentHtml, { company });
  // V35.5: visualVerify als zusaetzliches Feld in passes-Objekt
  passes.visual_verify_total = visualResult.total !== null ? (visualResult.total + '/' + visualResult.max) : 'n/a';
  for (const [k, v] of Object.entries(visualResult.passes || {})) passes['visual_' + k] = v;
  passes.iter_count = iterCount;

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
    branche_cluster: profile.slug,
    signature_effect: profile.signature_name,
    design_thesis: 'V35.5 Hybrid-Pool: ' + profile.slug + ' / auth=' + ((globalThis.__VFS_AUTHENTIC_POOL || []).length) + ' stock=' + ((globalThis.__VFS_PEXELS_POOL || []).length) + ' ai=' + ((globalThis.__VFS_AI_POOL || []).length) + ' logo=' + (globalThis.__VFS_LOGO ? globalThis.__VFS_LOGO.source : 'none'),
    mail_subject: mailSubject,
    mail_body: mailBody,
    prompt_version: 'v35_5_visual_verify_iter_2026-05-06',
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
