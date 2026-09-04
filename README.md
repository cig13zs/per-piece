# Per Piece

Shows the real price per unit next to every product on Shopee, Lazada, Amazon,
eBay, AliExpress, Temu, Shein, Walmart, Target and Flipkart, so a "3PCS BUNDLE
SALE" can be checked against a single pack in one glance instead of in your
head.

A tile priced at ₱62 for 300 g gets a green **₱20.7/100g ✓ best**. The six-pack
at ₱560 gets a red **₱31.1/100g**, because per gram it is half again as
expensive. On amazon.com the same badge reads **$2.49/100g**, in dollars,
because the currency is taken from the page.

## How it works

Everything happens on the page you are already looking at. There is no server,
no account, no API key and no AI model - the extension never makes a network
request on its own. It reads the product title and the price that are already
on screen, does arithmetic, and writes a small badge next to the price.

Three design rules matter more than coverage:

**A wrong number is worse than no number.** Anything ambiguous returns nothing
and the tile stays blank. `iPhone 15 Pro Max 256GB` has no package size, so it
gets no badge. `Backpack 30L` describes the bag's capacity rather than anything
you consume, so it gets no badge either. `Shampoo 400ml + Conditioner 250ml`
holds two different sizes with no way to tell which one the price covers, so it
stays blank too.

**No CSS selectors.** Every one of these stores ships obfuscated class names
that rotate on deploy, so anything built on `.shopee-search-item-result__item`
breaks within weeks. Instead the content script finds text shaped like a price,
then climbs to the smallest ancestor that still contains exactly one price.
That ancestor is the product tile on any layout, and it survives a redesign.
It is also why one content script covers ten different retailers.

**Read what the shopper pays.** Struck-through "original" prices are skipped
everywhere, including when a store renders the old price *before* the current
one. Amazon, Walmart and Target print every price twice - once for screen
readers and once for eyes, the visual copy split into spans that concatenate to
`$848` - so the accessible copy is the one read and the `aria-hidden` twin is
ignored. Reading either of the wrong ones quotes a wrong number, and every unit
price after it would be wrong too.

## Files

| File | Does |
|---|---|
| `parse.js` | Quantity parsing, currency and number parsing, unit-price maths, ranking. Pure, no DOM. |
| `content.js` | Finds tiles, injects badges, watches for infinite scroll. |
| `content.css` | Badge styling, every property explicit so the stores' cascade cannot reach it. |
| `popup.html/js` | On/off switch, scan-this-page button, report button. |
| `test/parse.test.js` | 83 assertions over real title formats. |
| `test/fixture.html` | Fake Shopee and Amazon grids for checking the DOM layer in a browser. |

## Develop

```bash
node test/parse.test.js
```

To check the DOM layer, serve the folder and open `test/fixture.html`. The
fixture reproduces what makes the real pages awkward: obfuscated class names,
the peso sign split into its own span, struck-through originals on both sides
of the current price, Amazon's doubled `.a-price` markup, and two currencies on
one page so the per-currency ranking is exercised.

```bash
python -m http.server 8731
```

To load it in Chrome: `chrome://extensions` → Developer mode → Load unpacked →
pick this folder.

## Supported

Runs by itself on Shopee and Lazada across every market they operate in, on
Amazon's twenty-one country domains, on eBay, AliExpress, Temu, Shein, Walmart,
Target, Costco, Flipkart and TikTok Shop.

Anywhere else, open the popup and press **Scan this page**. That uses
`activeTab`, so the extension gets access to that one tab at the moment you ask
and to nothing else. It is the same code, run on demand.

Currencies are read off the page rather than assumed: ₱ P PHP, $ S$ HK$ NT$ A$
C$ NZ$ R$ MX$, £, €, ¥, ₹, ₩, ฿, ₫, Rp, RM, CHF, AED, SAR, zł, Kč and kr. Both
number conventions are handled, and the distinction is load-bearing - `1.234,56`
is one thousand two hundred, `Rp 125.000` is a hundred and twenty-five thousand,
and getting it backwards is a 1000x error. Ranking is grouped per currency, so
a page showing two never compares across them.

## Units

Mass and volume are shown per 100 g and per 100 ml. Counts are shown per piece.
When a listing carries both a size and a count (`Vitamin C 500mg 100s`), it
means "100 units of that size", so per piece is the honest reading - per 100 g
of a tablet bottle is meaningless. Explicit multipacks (`300g x 6`, `24 x 22g`,
`Twin Pack`, `Pack of 42`, `30 Count`) are multiplied out to the true total
first.

## Reporting a bad badge

The popup has a report button. It builds a note from what the page already
showed you, copies it to your clipboard, and opens a pre-filled GitHub issue so
you can read it and decide whether to send it. Nothing is gathered in the
background and nothing is sent automatically. Those reports are the only
feedback channel, which is why the button exists at all.

## Licence

MIT. Free forever - [buy me a coffee](https://ko-fi.com/jju1s) if it saved you
money.
