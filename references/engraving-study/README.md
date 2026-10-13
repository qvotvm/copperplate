# Engraving study: what a real plate looks like

The kit was calibrated against public-domain sheets from Wikimedia Commons. Pixel measurements are in `measurements.json`. Reference images and downloaded metadata are not included. The filenames below identify the sheets used for the study.

| File | What | Printer | Why it matters |
|---|---|---|---|
| `prr-1912.jpg` | Pennsylvania Railroad stock, 1912, 3564 x 2364 | American Bank Note Co. | Dark title panel with reversed shaded letters, wide scalloped lathe border, microtext tint over the whole body |
| `pocahontas-1907.jpg` | Pocahontas Consolidated Collieries, 1907, 2048 x 1430 | American Bank Note Co. | Two inks: blue lathe border and panels, black title and vignette. Reversed numerals in corner panels |
| `bo-railroad.jpg` | Baltimore and Ohio trust certificate, c. 1899, 3426 x 2225 | International Bank Note Co. | Solid fat-face title with drop shadow, engraved script body, full-figure stipple vignette, moiré border |
| `bo-common.jpg` | Baltimore and Ohio common stock, 1315 x 861 | ABNC | Smaller sample of the same vocabulary |
| `standard-oil-1882.jpg` | Standard Oil Trust, 1882, 3840 x 2028 | Franklin Bank Note Co. | Fat-face title with shadow and flourish rays, landscape vignette with graduated sky, scalloped border |
| `usd1-1899-black-eagle.jpg` | $1 silver certificate 1899, 2500 x 2247 | Bureau of Engraving and Printing | Eagle feathers: contour lines that swell, cross only in shadow; reversed title on lathe panel |
| `usd2-1896-educational.jpg` | $2 silver certificate 1896, 3840 x 3367 | BEP | Figures in stipple and line, oval vignette fade, very dense border |
| `iceland-5kr-1928.png` | Landsbanki Islands 5 kronur 1928, 950 x 562 | Bradbury Wilkinson | Portrait in stipple, lattice guilloche underprint, shaded reversed lettering |

## Measurements

Pixel scale: PRR 12.3 px/mm, $1 note 13.2 px/mm. Coverage is the share of pixels darker than the midpoint between the paper and ink levels.

| Element | Reference | Coverage | Line pitch | Note |
|---|---|---|---|---|
| Whole sheet | PRR 1912 | 26.5% | | Pocahontas 27.1%, B and O 31.7%. The earlier kit sat at 18 to 20%, which is why it read as pale |
| Border band | PRR 1912 | 60% | 72 crossings per 1000 px horizontally, about 1.1 mm | Two sinusoidal families cross at a shallow angle; a third, coarser wave gives the scallop and the moiré |
| Border band | B and O | 78% | 29 per 1000 px | Nearly solid at the dark nodes, bright lozenges between |
| Title panel | PRR 1912 | 53% | | Letters are paper, the ground is a dense lathe tint, letters carry a hard dark drop shadow to the right and down, about 0.18 of cap height |
| Title | Standard Oil | 14% of its box | | Fat-face letters solid ink, white hairline inline near the left edge of each stem, drop shadow offset about 0.12 cap height, flourish rays |
| Title | B and O | 51% | | Fat condensed letters, solid, outlined by paper, over a vertical-line tint |
| Title cap height | all three | 7 to 9% of sheet height | | The earlier title was 67 units on 1000, 6.7%, but hatched grey |
| Sky | Standard Oil vignette | 18% | 68 per 1000 px, about 2 units at 1600 plate width, hairline | Horizontal ruling, graduated: denser near the horizon, dropping out upward |
| Ground | Standard Oil vignette | 58% | 152 per 1000 px, about 2.75 units, but lines are wider | Dense cross families, dark toward the foreground |
| Eagle wing | $1 1899 | 28% | | Contour lines follow each feather; width swells toward the shaft; crossing only in deep shade |
| Eagle breast | $1 1899 | 70% | | Three crossing families plus dots in the darkest patches |
| Drapery | B and O figure | 37% | 31 per 1000 px | Stipple on skin, contour lines on cloth, dropped out to pure paper at highlights |
| Body tint | PRR 1912 | 12% | | Repeating company name microtext, size about 1 mm |

## Techniques to copy

1. Tone comes from four things at once: line spacing, line width, number of crossing families, and dropout. One hatch family at one width, which is what the earlier kit did everywhere, reads as a vector illustration.
2. Lines follow the form. Cylinders and bodies are ruled around their axis; planes are ruled flat; sky is ruled horizontally; water is ruled with long low waves. A straight 35 degree hatch across everything is the single biggest tell.
3. Highlights are paper. Lines thin and then stop before the lit edge. Shadow sides get a second family at 60 to 90 degrees and, in the darkest 15%, a third one.
4. Vignettes fade into the paper with no frame: the ruling breaks into shorter dashes and then disappears along an oval.
5. Titles are the darkest thing on the sheet. Either solid fat-face letters with a drop shadow and a hairline inline, or paper letters reversed out of a dense dark panel. Never grey.
6. Borders are wide, 5 to 7% of the sheet width per side, and dense, 55 to 75%. Several wave families of different period cross to make moiré, plus a scalloped edge.
7. Denominations sit in reversed panels (dark ground, paper numerals) in the corners and in the side bands.
8. Body copy mixes three voices: engraved script for the legal phrases, roman small caps for the certifying lines, and a fat face for the share count in words.
9. Microtext and a repeating tint make the paper itself look printed.
10. Everything is one or two inks. Two-ink sheets put the lathe border and panels in colour and the title plus vignette in black.

## Typography

- Body: EB Garamond (OFL) stays. The references use a Scotch roman or modern face for small caps; Garamond is close enough at 12 to 22 units.
- Title: the The earlier title was EB Garamond Bold with grey hatching. The references are fat-face Didones and Tuscans. Abril Fatface (OFL, Type Together) is the closest open face to the Standard Oil and B and O letters: heavy stems, hairline serifs, ball terminals. Bundled as `assets/fonts/AbrilFatface-400.woff2`, latin subset.
- Script: the certifying lines on every reference are engraved copperplate script. Pinyon Script (OFL) is a copperplate-style script drawn for engraving. Bundled as `assets/fonts/PinyonScript-400.woff2`, latin subset.
- Both fonts were fetched from the Google Fonts CSS endpoint as the latin `unicode-range` block. Licenses are in `assets/fonts/OFL.txt`.

## What the kit now does with this

- `hatch.mjs`: every hatch line is cut into runs whose stroke width follows a shade field (swelling), runs below the highlight threshold are dropped, a second family appears only where shade exceeds 0.55 and a third above 0.85. `contour` rules around the form. `stipple` lays deterministic dots for skin and soft tone. `ruling` makes graduated sky and water. `fade` breaks ruling into dashes along an oval.
- `guilloche.mjs`: `latheBand` crosses two sinusoid families and overlays a coarser wave for moiré, `scallop` draws the wavy outer edge, `rosette` sums two harmonics, `panel` fills a reversed-out ground.
- `type.mjs`: `title` sets Abril Fatface with a drop shadow, paper halo and hairline inline; `reversed` sets paper letters on a dark panel; `script` sets Pinyon Script; `microtext` repeats text along a path.
