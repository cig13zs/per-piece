# Chrome Web Store listing — Per Piece

Copy-paste source for the dashboard. Fields are in submission order.

---

## Name (75 max)

```
Per Piece - Real Price Per Unit
```

Do **not** put "Shopee" or "Lazada" in the name. Using another company's mark
as your product name is the usual trigger for a trademark complaint and a
takedown. Naming them inside the description as the sites you support is
ordinary descriptive use and is fine.

## Summary (132 max)

```
Shows the real price per 100g, 100ml or per piece while you shop, so you can see which bundle is actually cheaper.
```

## Category

Shopping

## Language

English

---

## Description

```
Is the bundle actually cheaper? Per Piece answers that before you add to cart.

It puts a small badge under every price on Shopee and Lazada Philippines
showing what the item really costs per 100g, per 100ml, or per piece. The
cheapest option on the page gets a green tick. Anything that costs at least
half again as much per unit gets flagged in red.

So a 300g pack at P62 shows P20.70/100g, and the "3PCS BUNDLE SALE" beside it
that works out to P31.10/100g stops looking like a deal.

WHAT IT DOES

- Price per 100g, per 100ml, or per piece, right under the price
- Marks the best value on the page, and flags the ones that are much worse
- Reads multipacks properly: "300g x 6", "24 x 22g", "Twin Pack"
- Reads Philippine shelf shorthand like "10s" for a 10-tablet pack
- Ignores struck-out original prices and uses what you would actually pay
- Works while you scroll, on search results and on product pages

WHEN IT STAYS QUIET

A wrong number is worse than no number, so it shows nothing when it cannot be
sure. Phones and laptops have no package size. A "30L backpack" is a bag, not
30 litres of anything. A listing holding two different sizes gives no way to
tell which one the price covers. In all of those cases the badge is simply
left off.

PRIVACY

There is no account, no sign-up and no API key. The extension makes no network
requests whatsoever. Nothing is collected, nothing is transmitted, and no data
leaves your computer. All it stores is whether you switched the badges on or
off.

It runs only on shopee.ph and lazada.com.ph, and has no access to any other
site, to your tabs, or to your browsing history.

Free, and open source.

Not affiliated with, endorsed by, or connected to Shopee or Lazada. The badges
are a shopping aid based on the size stated in each listing. If a seller writes
the wrong size in their title, the figure will be wrong too.
```

---

## Single purpose

```
Calculate and display the price per unit (per 100g, per 100ml, or per piece)
for products shown on Shopee Philippines and Lazada Philippines pages.
```

## Permission justifications

These two fields are where most rejections happen. Keep them concrete.

**`storage`**

```
Stores exactly one value: whether the user has switched the unit-price badges
on or off. It is kept locally and is never transmitted. No other data is
stored.
```

**Host access — shopee.ph and lazada.com.ph**

```
The extension reads the product title and price that are already displayed on
Shopee Philippines and Lazada Philippines search and product pages, in order to
calculate a price per unit and draw a badge next to each price. These two sites
are the only pages the feature applies to, so they are the only pages the
extension is allowed to run on. No other host access is requested.
```

**Remote code**

No. All code is contained in the package. Nothing is fetched or evaluated at
runtime.

## Data usage disclosures

Tick nothing. Then confirm all three certifications:

- Not being sold to third parties
- Not being used or transferred for any purpose unrelated to the item's single purpose
- Not being used or transferred to determine creditworthiness or for lending

## Privacy policy URL

Point at the raw `PRIVACY.md` on GitHub, or a GitHub Pages copy. A reachable
public URL is mandatory even though the answer is "nothing is collected".

---

## Screenshots (1280x800, at least one, five allowed)

Take these from a real shopee.ph search once the extension is loaded unpacked.
Real captures convert better than mockups, and reviewers can tell.

1. A grocery search grid with badges visible, including one green best and one
   red worst in the same viewport. This is the whole pitch and should be
   screenshot one.
2. Tight crop on a single pack next to its multipack, so the two figures can be
   read side by side.
3. The popup open, showing the switch and the colour key.
4. A product page with the badge under the main price.

Add a short caption burned into each image. Screenshot one should say something
close to "The bundle is not always cheaper."

## Small promo tile (440x280)

Green background, the icon, and the words "Per Piece" with "real price per
unit" underneath. Keep text large; it renders small in the store.
