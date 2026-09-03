# Privacy policy — Per Piece

Last updated: 4 September 2026

## What is collected

Nothing.

Per Piece does not collect, transmit, sell, or share any data. There is no
server, no analytics, no tracking pixel, no crash reporter and no third-party
service of any kind. The extension never makes a network request on its own.

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

On Shopee Philippines and Lazada Philippines pages only, the extension reads
the product titles and prices that are already displayed on the page. It uses
them to calculate a price per unit and to draw a small badge next to the price.

That reading happens in your browser and the result is discarded when you leave
the page. Nothing is written to disk, and nothing leaves your device.

## What is stored

One setting: whether the badges are switched on or off. It is kept in Chrome's
local extension storage on your own computer. It is not synced and not
transmitted.

Removing the extension removes it.

## Permissions

**`storage`** — saves the on/off switch described above. Nothing else is stored.

**Access to shopee.ph and lazada.com.ph** — the extension only runs on those
two sites, because those are the pages whose prices it annotates. It has no
access to any other website, to your browsing history, to your tabs, or to your
Shopee or Lazada account.

## Accuracy

Per Piece performs arithmetic on the text a listing shows. If a seller states
the wrong pack size in the title, the resulting figure will be wrong too. When
a size cannot be read with confidence, no badge is shown rather than a guess.
The badges are a shopping aid and not a guarantee about any product or price.

## Contact

Open an issue on the project's GitHub repository.
