# Per Piece

Shows the real price per unit next to every product on Shopee and Lazada
Philippines, so a "3PCS BUNDLE SALE" can be checked against a single pack in
one glance instead of in your head.

A tile priced at ₱62 for 300 g gets a green **₱20.7/100g ✓ best**. The six-pack
at ₱560 gets a red **₱31.1/100g**, because per gram it is half again as
expensive.

## How it works

Everything happens on the page you are already looking at. There is no server,
no account, no API key and no AI model. The extension reads the product title
and the price that are already on screen, does arithmetic, and writes a small
badge next to the price.

Two design rules matter more than coverage:

**A wrong number is worse than no number.** Anything ambiguous returns nothing
and the tile stays blank. `iPhone 15 Pro Max 256GB` has no package size, so it
gets no badge. `Backpack 30L` describes the bag's capacity rather than anything
you consume, so it gets no badge either. `Shampoo 400ml + Conditioner 250ml`
holds two different sizes with no way to tell which one the price covers, so
it stays blank too.

**No CSS selectors.** Both stores ship obfuscated class names that rotate on
deploy, so anything built on `.shopee-search-item-result__item` breaks within
weeks. Instead the content script finds text shaped like a price, then climbs
to the smallest ancestor that still contains exactly one price. That ancestor
is the product tile on any layout, and it survives a redesign.

Struck-through "original" prices are skipped everywhere, including when a store
renders the old price *before* the current one. Reading those would quote the
inflated number and every unit price after it would be wrong.

## Files

| File | Does |
|---|---|
| `parse.js` | Quantity parsing, unit-price maths, ranking. Pure, no DOM. |
| `content.js` | Finds tiles, injects badges, watches for infinite scroll. |
| `content.css` | Badge styling, every property explicit so the stores' cascade cannot reach it. |
| `popup.html/js` | One on/off switch. |
| `test/parse.test.js` | 47 assertions over real PH title formats. |
| `test/fixture.html` | A fake Shopee grid for checking the DOM layer in a browser. |

## Develop

```bash
node test/parse.test.js
```

To check the DOM layer, serve the folder and open `test/fixture.html`. The
fixture reproduces what makes the real pages awkward: obfuscated class names,
the peso sign split into its own span, struck-through originals on both sides
of the current price, and tiles nested several levels deep.

```bash
python -m http.server 8731
```

To load it in Chrome: `chrome://extensions` → Developer mode → Load unpacked →
pick this folder.

## Supported

Shopee PH and Lazada PH. Both use ₱, which is the only currency the price
reader understands right now. Other Shopee and Lazada markets are one entry in
the manifest plus a currency pattern, but they are deliberately not shipped
until someone can test them on the real sites.

## Units

Mass and volume are shown per 100 g and per 100 ml. Counts are shown per piece.
When a listing carries both a size and a count (`Vitamin C 500mg 100s`), it
means "100 units of that size", so per piece is the honest reading — per 100 g
of a tablet bottle is meaningless. Explicit multipacks (`300g x 6`, `24 x 22g`,
`Twin Pack`) are multiplied out to the true total first.
