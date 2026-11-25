# Gin 47 — "The Gin Exhibition"
### Research, information system and design defense (Route B: HTML5 + CSS3 + JavaScript)

> **Team:** _[8 members — add names]_ · **Course:** _[course / professor]_ · **Date:** November 2026
> **Business:** Gin 47 Mixology & Kitchen, Calle 47 #459 x 52 y 54, Centro, Mérida, Yucatán (real local business).
> **Deliverable:** 8-page static site, opens from `index.html`. Academic concept, not affiliated with the business.

---

## 1. Problem, research and project analysis

### 1.1 The business
| Fact | Value | Source |
|---|---|---|
| Opened | 2017, "the city's first specialized gin bar" | Gin 47 menu p.1; gin47mx.com |
| Location | Calle 47 #459 x 52 y 54, Centro, 97000 Mérida — Corredor Gastronómico | gin47mx.com |
| Hours | Sun–Wed 17:00–00:30 · Thu–Sat 17:00–02:00 | gin47mx.com (published as "12:30hrs") |
| Reservations | WhatsApp / phone +52 999 241 5334 | gin47mx.com "Reservar" button |
| Offer | 51 gins from 10 countries, 23 author cocktails, 9 house G&Ts, 14 entrees, 12 specialties | Gin 47 menu (EN/ES PDF, Feb 2026) |
| Price range | Entrees MXN 195–390 · cocktails MXN 195–265 · G&T MXN 165–195 | Gin 47 menu (Feb 2026) |

### 1.2 Audit of the current website (gin47mx.com, reviewed 24 Nov 2026)
| # | Problem found | Evidence | Decision on our site |
|---|---|---|---|
| P1 | One single long page; no About / Menu / Contact pages | WordPress + Elementor one-pager | 8 pages with one function each (sitemap §2) |
| P2 | The menu exists only as a ~9.7 MB PDF | `GIN47_MENU-ING-WEB_compressed.pdf` | Menu rebuilt as HTML with filters (`products.html`, `cocktails.html`, `gin.html`) |
| P3 | No reservation form; only a WhatsApp link | "Reservar" → api.whatsapp.com | Validated form that **writes** the WhatsApp message (`contact.html`) |
| P4 | Map embed points to "corredor gastronómico" in general, zoom 12 | iframe `q=corredor gastronomico&z=12` | Map at the exact address, zoom 17 + text address fallback |
| P5 | Instagram feed frozen at Nov 2024 posts | sb-instagram-feed images dated 2024 | Curated gallery + link to Instagram, no live feed to go stale |
| P6 | Copy errors | "12:30hrs" (should be 00:30), "Burguer", "Treat yoursefl" | Corrected copy, 12-hour clock for English readers |
| P7 | No video | — | 16 s ambience film with controls (`gallery.html`) |
| P8 | Background images carry content without alt text; grey #999 body text | Elementor background-image sections | Every content image is an `<img>` with descriptive alt; AA contrast tokens |

**Problem statement.** Gin 47 has a strong product (Mérida's first gin bar, 51 gins, a kitchen with Yucatecan ingredients) but its website hides it: the menu is a heavy PDF that is hard to read on a phone, booking depends on a bare WhatsApp link, and the location is imprecise. A visitor deciding *where to drink tonight* cannot quickly see what is served, how much it costs, whether it is open, and how to book.

> **NN/g evidence:** PDFs are "unfit for human consumption" on the web: they break navigation, are slow and hard to read on mobile (Nielsen, J., 2020, *PDF: Still Unfit for Human Consumption, 20 Years Later*, Nielsen Norman Group).

### 1.3 Segmentation
| Segment | Who | Need on the site | Pages that serve it |
|---|---|---|---|
| S1 Local nightlife | Meridanos 25–40 who go out Thu–Sat | What's new, cocktails, "open now", book fast | 03 Cocktails, 07 Reserve, 00 status pill |
| S2 Visitors in Centro | National and international tourists staying near Paseo de Montejo | English content, exact location, prices in MXN, what is local | 05 Yucatán, 04 Kitchen, 07 Map |
| S3 Groups & occasions | Birthdays, dates, business dinners | Capacity, occasion, notes, confirmation | 07 form (occasion, guests ≤ 12, notes) |
| S4 Gin enthusiasts | People who choose the bar *for* the gin | The full gin list, G&T styles | 02 The Gin |

> ⚠ **Fieldwork to complete by the team (do not invent results):** a short survey (5 questions, n ≥ 30, Google Forms) to guests or classmates who go out in Centro: (1) how they choose a bar, (2) whether they open a PDF menu on the phone, (3) preferred booking channel, (4) language of browsing, (5) what makes them trust a bar website. Paste the real numbers here and link them to the decisions above.

### 1.4 Scope and costs (estimate for a real launch)
| Item | Scope / assumption | Estimated cost (MXN) |
|---|---|---|
| Domain `.com` | already owned (gin47mx.com) | 0 (renewal ≈ 300 / year) |
| Hosting | static site on Netlify / GitHub Pages free tier, or shared hosting | 0 – 1,500 / year |
| Design + front-end | 8 pages, ~60 h at a junior rate of MXN 350/h | ≈ 21,000 |
| Photography | reuse of the bar's own photos; new shoot optional | 0 (shoot ≈ 4,000–8,000) |
| Video | edited from existing photos | 0 |
| Menu updates | edit HTML lists when prices change (≈ 1 h / update) | ≈ 350 / update |
| **Out of scope** | online payments, live table availability, CMS, Instagram API | — |

_Rates are team estimates for the exercise; replace with quotes if the professor requests real ones._

---

## 2. Visual information system

### 2.1 Sitemap (8 chapters, like an exhibition)
```
00 index.html      Opening      — hero, 3 signature drinks, the 7 rooms, visit strip
├─ 01 about.html     Origin       — manifesto, timeline, the 4 things that coexist, the room
├─ 02 gin.html       The Gin      — anatomy of a G&T (5 elements), 9 house G&Ts, 51-gin library
├─ 03 cocktails.html Cocktails    — 23 author cocktails (filter by base), classics, mocktails
├─ 04 products.html  Kitchen      — entrees, specialties, desserts & digestives (filters)
├─ 05 yucatan.html   Yucatán      — 5 ingredient "specimen plates", the place
├─ 06 gallery.html   After Dark   — film (video) + 12-photo lightbox
└─ 07 contact.html   Reserve      — epilogue, reservation form, hours, map
```
Required file names from the brief are kept (`index`, `about`, `products`, `contact`); the four extra pages cover the 8-member team scope.

### 2.2 Navigation codes (same on every page)
- **Header:** logo (home), "Reserve" shortcut, **Index** button (full-screen chapter list) and the chapter number in italics (`00`–`07`).
- **Chapter bar (bottom):** `← Previous · progress line · Next →`. The gold line fills as you scroll: *where am I and how much is left*.
- **Footer:** address, hours, all 8 links, credits, LLM declaration.

### 2.3 Tokens and components
| Token | Value | Use |
|---|---|---|
| `--ink` | #0f0d0b | background (warm off-black, from the bar's low light) |
| `--bone` | #eee9e0 | main text (16.0:1) |
| `--mute` | #a89f92 | secondary text (7.4:1) |
| `--gold` | #c9a45c | the **only accent**: numbers, rules, focus, active states (8.3:1) |
| `--paper` / `--paper-ink` | #e7dfd1 / #2a2117 | menu sheets (12.0:1) |
| Type | Geist (sans, UI and headings) + Cormorant Garamond italic (emphasis, numbers) | Cormorant is already the brand's font on gin47mx.com |
| Scale | h1 clamp(2.5–5.2rem) · h2 2–3.6rem · h3 1.4–1.9rem · body 17px/1.65 | |

Components: eyebrow (rule + caps), headline (sans + italic serif word), caps lede, pill buttons, chips (filters), dish row (name · leader dots · price), accordion, specimen plate, gilt frame, lightbox, form field (label above, help, error below).

---

## 3. Perceptual and cultural foundations (applied and defended)

### 3.1 Perceptual decisions (verifiable on the site)
| # | Decision | Where to verify | Principle and evidence |
|---|---|---|---|
| PE1 | **Figure–ground halftone:** hero photos are dimmed and redrawn as a grid of dots that swell under the pointer. The headline is the figure; the photo becomes texture. | Hero of every chapter (`.dots` canvas) | Figure–ground segregation (Rubin, 1915); reduced detail in the ground keeps text legible over imagery. Reference: Of/Horse exhibition site. |
| PE2 | **One accent (gold) = "this matters":** numbers, prices on paper, active filter, current chapter, focus ring. | Chapter numbers, chips `aria-pressed`, `:focus-visible` | Isolation / Von Restorff effect (von Restorff, 1933; Lidwell, Holden & Butler, 2010, *Universal Principles of Design*). |
| PE3 | **Proximity + common region in the menu:** name, leader dots and price on one line, description under it, a 1px rule between dishes, kraft "sheet" region per menu. | `products.html`, `cocktails.html` | Gestalt proximity (Wertheimer, 1923) and common region (Palmer, 1992, *Cognitive Psychology* 24). |
| PE4 | **Chunking and fewer choices:** 34 kitchen items and 51 gins are split into 4–7 filter chips with a live count. | Filters + `role="status"` | Hick–Hyman law (Hick, 1952; Hyman, 1953): decision time grows with the number of options. |
| PE5 | **Serial reading in the G&T anatomy:** one element at a time, numbered 01–05 on a rail. | `gin.html` (≥ 900 px) | Progressive disclosure (Nielsen, 2006, NN/g). |
| PE6 | **Continuity (opening plate and gallery walk):** the camera zooms into the painted G&T until it lands exactly on the anatomy plate's glass; five parts appear one by one, each tied to its point by a leader line. | `index.html` opening sequence | Gestalt connectedness and common fate (Palmer & Rock, 1994); object constancy keeps one glass as the figure across the cut. |

### 3.2 Cultural decisions (verifiable on the site)
| # | Decision | Where to verify | Cultural evidence |
|---|---|---|---|
| CU1 | **Yucatecan ingredients as protagonists:** gold tags "Xcatic", "Queso de bola", "Salbutes", "Xtabentún" and a whole chapter of "specimen plates". | `yucatan.html`, tags in 03 and 04 | Gin 47's own menu uses xcatic in 13 items, salbutes, queso de bola and xtabentún (menu, Feb 2026). _[Team: add one academic or official source on Yucatecan cuisine, e.g. SEFOTUR Yucatán or a regional gastronomy book.]_ |
| CU2 | **The kraft menu sheet:** menu pages use the warm paper colour and a juniper sprig, echoing the printed menu guests hold in the bar. | `.sheet` sections | Continuity with the business's printed artefact (Gin 47 menu PDF: kraft paper, botanical ornaments). |
| CU3 | **Night-time codes of the bar:** warm off-black, amber photography, candlelight, gilt frame. | Whole site | Gin 47's photography and interior (gin47mx.com, @gin47mx). |
| CU4 | **English for the visitor segment, MXN prices and 12-hour clock;** Spanish dish names kept (*salbutes, queso de bola, copa balón*) with `lang="es"` where needed. | All pages | Segment S2; the bar already offers an English menu (GIN47_MENU-ING-WEB). |
| CU5 | **Local booking habit:** the form hands off to WhatsApp, the channel the bar already uses. | `contact.html` | gin47mx.com "Reservar" → WhatsApp. |

### 3.3 Written defense — the four questions
_[Paste the professor's four questions here. Answer each with: the decision, where it is verifiable on the site, and the citation from §3.1–3.2.]_

---

## 4. Text and image hierarchy
- One `h1` per page; `h2` per section; `h3`/`h4` for items. Hierarchy uses **weight and the italic serif word**, not size alone.
- Every page opens with the same pattern: eyebrow (chapter) → h1 → caps lede → action.
- Images show what the text talks about: the Morita photo next to the Morita, tostones on the xcatic plate, the dining room in "The room".

## 5. Technical quality and production

### 5.1 Mandatory components
| Requirement | Implementation |
|---|---|
| Optimized images | 24 photos → WebP 800/1600 w with `srcset`, `width`/`height`, lazy loading (3.1 MB total) |
| Descriptive alt | Every content image; decorative ornaments use `alt=""` |
| Video with controls, responsive | `<video controls playsinline poster>` 1280×720 MP4 (1.6 MB), `width:100%`, text description (WCAG 1.2.1, video-only) |
| Validated form + declared strategy | JS validation (name, 10-digit phone, optional email, date today–60 days, time ≥ 30 min ahead, guests 1–12, age), inline errors + error summary. **Strategy:** on success it opens WhatsApp to +52 999 241 5334 with the request written; nothing is stored. Stated above the form. |
| Responsive map | Google Maps iframe in a 4:3 / 16:10 box, exact address, text fallback, link to directions |
| Responsive at 3 widths | Tested at 375 × 812, 768 × 1024, 1440 × 900: no horizontal scroll on any page |
| AA accessibility | Contrast table §2.3, skip link, visible focus, 44 px targets, native `<dialog>`, `aria-pressed` chips, `role="status"` counts, `prefers-reduced-motion` respected |
| Validation | `html-validate` recommended ruleset: 0 errors on 8 pages. W3C Nu validator on the live site (2026-11-24): 0 errors, 0 warnings on index, about, gin, cocktails, contact, gallery. _[Team: run products.html and yucatan.html at https://validator.w3.org/ and attach screenshots.]_ |
| Live site | https://eduardo1704.github.io/gin47-website/ (GitHub Pages, `noindex` so it never competes with gin47mx.com) |
| Links | Script check: 0 broken internal links or anchors |
| Works from the zip | Fonts and libraries are local (`fonts/`, `js/vendor/`); only the map needs internet |

### 5.2 JavaScript — justified purpose
| Feature | Purpose | Without JS |
|---|---|---|
| Menu filters | Find a drink or dish in 51 / 34 items fast | Full lists are visible |
| Reservation validation + WhatsApp hand-off | Correct, complete booking requests | Phone and WhatsApp links remain |
| "Open now" + today's row | Answer "is it open?" in Mérida time | Static hours table |
| Chapter index dialog, progress line | Wayfinding across 8 chapters | Footer and Previous/Next links |
| G&T anatomy scene | Explain five elements one at a time | Stacked list |
| Lightbox | See photos large, keyboard arrows | Photos in the grid |
| Opening sequence (bar room → painting → presentation → G&T anatomy plate → gallery wall where the camera steps back, walks to the next framed painting and steps into it for chapters 01–07) | Introduce the bar as an exhibition and explain the drink before the rooms (Of/Horse reference) | Static room, presentation, plate and seven stacked chapter sections |
| Living gallery wall (light pools + tonic bubbles with parallax) and letter roll in the header | Atmosphere and feedback: the wall reads as depth while walking between paintings; the header words and chapter number move on hover and on change | Plain wall is not built; header words stay static |
| Halftone hero, preloader, reveals, smooth scroll | Exhibition atmosphere (Of/Horse reference); disabled with reduced motion | Plain photo hero |

Libraries: GSAP 3.13 + ScrollTrigger (scroll scenes), Lenis 1.3 (smooth scroll). Logic is unit-checked in `_src/tests.mjs` (opening hours, form rules).

## 6. LLM declaration
This site was built with the assistance of **Claude (Anthropic)**, a large language model, used for: analysing the reference sites, drafting code (HTML/CSS/JS), converting the menu PDF into HTML lists and drafting this document. The team directed the design, checked every business fact against gin47mx.com and the official menu, and is responsible for the final content.

## 7. Credits and references
- Gin 47 Mixology & Kitchen — gin47mx.com, menu PDF ES/EN (Feb 2026), Instagram @gin47mx: photographs, logo, menu copy and prices (educational use).
- Of/Horse — exhibition.ofhorse.se (structure and interaction reference); GSAP (gsap.com); React Bits tools and Unicorn Studio templates (effects references).
- European Union (2019). *Regulation (EU) 2019/787*, Annex I, cat. 20 "Gin" (juniper must predominate).
- Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1).
- Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45(3).
- Lidwell, W., Holden, K., & Butler, J. (2010). *Universal Principles of Design* (2nd ed.). Rockport.
- Nielsen, J. (2006). *Progressive Disclosure*. Nielsen Norman Group.
- Nielsen, J. (2020). *PDF: Still Unfit for Human Consumption, 20 Years Later*. Nielsen Norman Group.
- Palmer, S. E. (1992). Common region: A new principle of perceptual grouping. *Cognitive Psychology*, 24(3).
- Palmer, S. E., & Rock, I. (1994). Rethinking perceptual organization: The role of uniform connectedness. *Psychonomic Bulletin & Review*, 1(1).
- Rubin, E. (1915). *Synsoplevede Figurer*. Gyldendal.
- von Restorff, H. (1933). Über die Wirkung von Bereichsbildungen im Spurenfeld. *Psychologische Forschung*, 18.
- Wertheimer, M. (1923). Untersuchungen zur Lehre von der Gestalt II. *Psychologische Forschung*, 4.
- W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*.
