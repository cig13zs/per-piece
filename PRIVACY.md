# Privacy policy — Per Piece

Last updated: 4 September 2026

## What is collected

Nothing.

Per Piece does not collect, transmit, sell, or share any data. There is no
server, no analytics, no tracking pixel, no crash reporter, no API key, no AI
model and no third-party service of any kind. The extension never makes a
network request on its own.

## Reporting a wrong price

The popup has a button for reporting a price that looks wrong. It is the only
part of the extension that can send anything anywhere, and it does nothing
until you press it.

When you press it, the extension builds a note from what the page you are
looking at already showed you: the page address without its query string, and
the product titles and prices it read, marked as badged, not badged, or hidden.
That note is copied to your clipboard and opened in a pre-filled GitHub issue
form so you can read it, edit it, and decide whether to submit it.

Nothing is gathered in the background, nothing is stored between pages, and no
report is ever sent automatically. Close the tab and nothing has left your
computer. Query strings are dropped on purpose, because store URLs often carry
session and referral identifiers.

## What it reads

On the shopping sites listed in the extension's manifest — Shopee, Lazada,
Amazon, eBay, AliExpress, Temu, Shein, Walmart, Target, Costco, Flipkart and
TikTok Shop — the extension reads the product titles and prices that are
already displayed on the page. It uses them to calculate a price per unit and
to draw a small badge next to the price.

That reading happens in your browser and the result is discarded when you leave
the page. Nothing is written to disk, and nothing leaves your device.

## Scan this page

On any other website the extension does nothing at all unless you open the
popup and press **Scan this page**. That grants access to that one tab, at that
moment, under Chrome's `activeTab` permission, and runs the same reading and
arithmetic described above. It does not persist, it does not extend to other
tabs, and closing the popup without pressing the button grants nothing.

## What is stored

One setting: whether the badges are switched on or off. It is kept in Chrome's
local extension storage on your own computer. It is not synced and not
transmitted.

Removing the extension removes it.

## Permissions

**`storage`** — saves the on/off switch described above. Nothing else is stored.

**`activeTab`** — lets the "Scan this page" button work on a shop that is not in
the list, for that one tab, only when you press it.

**`scripting`** — the mechanism the button uses to run the extension's own
bundled files in that tab. No code is downloaded or generated at runtime; the
only thing it can run is the same `parse.js` and `content.js` that ship inside
the extension.

**Access to the listed shopping sites** — the extension only runs by itself on
those sites, because those are the pages whose prices it annotates. It has no
access to your browsing history, to your other tabs, or to any account you are
signed in to.

## Accuracy

Per Piece performs arithmetic on the text a listing shows. If a seller states
the wrong pack size in the title, the resulting figure will be wrong too. When
a size cannot be read with confidence, no badge is shown rather than a guess.
The badges are a shopping aid and not a guarantee about any product or price.

## Contact

Open an issue on the project's GitHub repository.
