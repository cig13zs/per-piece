# Chrome Web Store listing — Per Piece

Copy-paste source for the dashboard. Fields are in submission order.
Current package: **v1.2.0**.

---

## Name (75 max)

```
Per Piece - Real Price Per Unit
```

Do **not** put "Shopee", "Lazada" or "Amazon" in the name. Using another
company's mark as your product name is the usual trigger for a trademark
complaint and a takedown. Naming them inside the description as the sites you
support is ordinary descriptive use and is fine.

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

It puts a small badge under every price showing what the item really costs per
100g, per 100ml, or per piece. The cheapest option on the page gets a green
tick. Anything that costs at least half again as much per unit gets flagged in
red.

So a 300g pack at P62 shows P20.70/100g, and the "3PCS BUNDLE SALE" beside it
that works out to P31.10/100g stops looking like a deal.

WHERE IT WORKS

Shopee and Lazada in every market they operate in, Amazon in all twenty-one
countries, eBay, AliExpress, Temu, Shein, Walmart, Target, Costco, Flipkart and
TikTok Shop.

On any other shop, open the popup and press Scan this page. The extension then
runs on that one tab, only because you asked it to.

Prices are read in whatever currency the page uses - peso, dollar, pound, euro,
yen, rupee, won, baht, dong, ringgit, rupiah and more - and both number formats
are handled, so 1.234,56 and 1,234.56 are never confused.

WHAT IT DOES

- Price per 100g, per 100ml, or per piece, right under the price
- Marks the best value on the page, and flags the ones that are much worse
- Reads multipacks properly: "300g x 6", "24 x 22g", "Twin Pack", "Pack of 42"
- Reads shelf shorthand like "10s" for a 10-tablet pack and "30 Count"
- Ignores struck-out original prices and uses what you would actually pay
- Works while you scroll, on search results and on product pages

WHEN IT STAYS QUIET

A wrong number is worse than no number, so it shows nothing when it cannot be
sure. Phones and laptops have no package size. A "30L backpack" is a bag, not
30 litres of anything. A listing holding two different sizes gives no way to
tell which one the price covers. In all of those cases the badge is simply left
off.

PRIVACY

There is no account, no sign-up, no API key and no AI. The extension never
makes a network request on its own. Nothing is collected, nothing is
transmitted, and no data leaves your computer. All it stores is whether you
switched the badges on or off.

If a price looks wrong you can press the report button in the popup. It builds
a note from what the page already showed you, copies it to your clipboard, and
opens a pre-filled form so you can read it and decide whether to send it.
Nothing is gathered in the background and nothing is ever sent by itself.

Free, and open source.

Not affiliated with, endorsed by, or connected to any of the retailers named
above. The badges are a shopping aid based on the size stated in each listing.
If a seller writes the wrong size in their title, the figure will be wrong too.
```

---

## Single purpose

```
Calculate and display the price per unit (per 100g, per 100ml, or per piece)
for products shown on online shopping pages, so the user can compare value
between listings of different sizes.
```

## Permission justifications

These fields are where most rejections happen. Keep them concrete.

**`storage`**

```
Stores exactly one value: whether the user has switched the unit-price badges
on or off. It is kept locally and is never transmitted. No other data is
stored.
```

**`activeTab`**

```
The extension's popup has a "Scan this page" button for shopping sites that are
not in the extension's host list. Pressing it calculates unit prices for the
one tab the user is looking at, at that moment. activeTab is used instead of
broad host permissions precisely so that no access is held to any site the user
has not explicitly asked about.
```

**`scripting`**

```
Used only to run the extension's own bundled files (parse.js, content.js and
content.css) in the current tab when the user presses "Scan this page". No code
is downloaded, fetched or generated at runtime. Without it the button cannot
apply the same unit-price calculation on a site outside the host list.
```

**Host access — the listed shopping domains**

```
The extension reads the product title and price already displayed on search and
product pages of these shopping sites, in order to calculate a price per unit
and draw a badge next to each price. Those pages are the only place the feature
applies, so they are the only pages the extension runs on automatically. Every
listed domain is a retailer the feature is intended for; no broad or wildcard
host access is requested, and everywhere else requires the user to press the
button.
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

Take these from a real search page once the extension is loaded unpacked. Real
captures convert better than mockups, and reviewers can tell.

1. A grocery search grid with badges visible, including one green best and one
   red worst in the same viewport. This is the whole pitch and should be
   screenshot one.
2. Tight crop on a single pack next to its multipack, so the two figures can be
   read side by side.
3. An Amazon search in dollars, which is what tells a non-PH viewer the
   extension is for them too.
4. The popup open, showing the switch and the colour key.

Add a short caption burned into each image. Screenshot one should say something
close to "The bundle is not always cheaper."

## Small promo tile (440x280)

Green background, the icon, and the words "Per Piece" with "real price per
unit" underneath. Keep text large; it renders small in the store.

## Version notes for the update

v1.2.0 widens the site list from two Philippine stores to the major
international retailers, adds multi-currency price reading, and adds the
"Scan this page" button. The permission set gains `activeTab` and `scripting`;
both exist to avoid asking for broad host access.
