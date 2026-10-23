# Changelog

## 1.3.0 (2026-10-23)

- Pick the unit in the popup: weight per 100 g, per kg, per oz or per lb, and volume per
  100 ml, per litre or per fl oz, to match the shelf labels you are used to. Counts stay per
  piece. Open shop tabs redraw their badges straight away, and best and worst do not move.
- `node build.mjs` packs only the shipped files into `dist/per-piece-<version>.zip`.
- Tests run on every push (Node 24).

## 1.2.1 (2026-09-26)

- Store title leads with "unit price"; the listing discloses that the extension reads website
  content.

## 1.2.0 (2026-09-03)

- Runs on Amazon, eBay, AliExpress, Temu, Shein, Walmart, Target, Costco, Flipkart and TikTok
  Shop as well as Shopee and Lazada, in whatever currency the page uses.
- Scan this page button for any other shop, using `activeTab`.
- Reads Amazon's own per-ounce rate and screen-reader price copy correctly.

## 1.1.0 (2026-09-03)

- Report button that builds a note from what the page showed and opens a GitHub issue.
- Unit prices far out of line with the rest of the page are dropped instead of shown.

## 1.0.0 (2026-09-03)

- Unit-price badges for Shopee and Lazada Philippines.
