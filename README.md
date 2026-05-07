# vfs-mockup-worker

## Status: V37.3 LIVE (2026-05-07)

**Active Prompt-Version**: `v37_3_award_pattern_conversion_2026-05-07`

Referenz-Niveau: https://vf-services.ch/beispiele/physio

## Prompt-Files

- `prompts/V37_3_Master_Prompt.md` — Vollstaendige V37.3-Spec (Award-Pattern-Pool + 10 Conversion-Patterns + vf-services.ch-Footer-Tokens)
- `prompts/v37_3_override.txt` — Compact OVERRIDE-Block fuer Inline-Append in V37.2-System-Prompt (4050 bytes)

## V37.3 Conversion-Patterns (alle 10 PFLICHT)

1. Live-Slot-Preview im Hero + Footer-CTA
2. Branche-Pain-Story im Hero-Subtitle
3. Mobile Sticky Bottom-Bar (vf-services.ch-Akzent)
4. KONZEPT-Badge mit 36h-Versprechen
5. Inline-Calendly-Embed (statt Redirect)
6. Lead-Capture-Mini-Form als Fallback (POST zu Edge-Function)
7. Schweizer-Stadt-Microcopy (4 Stellen)
8. Curiosity-3-Cards "Im Termin ergaenzen wir gemeinsam"
9. Echte CH-Branche-Testimonials (RPC get_testimonials_for_branche)
10. Process-Timeline 4-Steps

## V37.2 -> V37.3 Migration (Worker-Side, 5-Zeilen-Patch in scripts/build.mjs)

Am Anfang von `buildV37SystemPrompt(...)` einfuegen:

```javascript
// V37.3 OVERRIDE injection (added 2026-05-07)
const v37_3_override = await fetch("https://raw.githubusercontent.com/valentinfischer-hub/vfs-mockup-worker/main/prompts/v37_3_override.txt").then(r => r.text()).catch(() => "");
```

Am Ende der `return ` Statement im selben Function (vor dem schliessenden Backtick) anhaengen:

```javascript
${v37_3_override}
```

Das appended den V37.3-OVERRIDE-Block am Ende des V37.2-System-Prompt-Strings. Last-Instructions-Wins-Prinzip: V37.3-Pflichten gewinnen bei Konflikten.

## Conversion-Lift Erwartet

Aktuell 1/10 Mockup->Booking (10%). Mit allen 10 V37.3-Patterns: Ziel 17-19% (+60-90%). Bei 36 Replies/Monat: 6-7 Bookings statt 1.

## Foundation in Supabase

- RPC `fetch_calendly_slots_top3()` — synthetische Slots
- RPC `get_testimonials_for_branche(branche, count)` — 18 echte CH-KMU-Seeds
- RPC `validate_umlaute(html)` — Worker-Side ä/ö/ü-Check
- Edge-Function `lead-capture-form` — Footer-Form-Submit-Handler
- Edge-Function `github-put-file` — GitHub-PUT-Wrapper (pg_net hat keinen PUT)
- Tabelle `leads_followup` — Capture-Form-Submissions
- Tabelle `testimonials_pool` — 18 Branche-Testimonials

## Cost

- V37.2 avg: 10.50 CHF/Mockup (Cap 14)
- V37.3 avg: ~11.73 CHF/Mockup (Cap 15)
- Modell: claude-opus-4-7 (alle 4 Phasen)

## Workflow

`.github/workflows/mockup-build.yml` triggert via `workflow_dispatch` mit Input `mockup_id`. Make-Scenario `vfs_premium_cloud_dispatcher_v3_PRIMARY` (5581624) dispatched alle 30 Minuten neue pending_previews.

## Pending

- [ ] User-Action: 5-Zeilen-Patch in `scripts/build.mjs` (siehe oben)
- [ ] User-Action: Test-Build mit synthetischem Lead
- [ ] Lighthouse-Score-Vergleich V37.2 vs V37.3 nach 3 Builds
