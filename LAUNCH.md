# Launch plan

The build was the easy half. Publishing changes nothing on its own: the median
Chrome extension has 14 users, 70.3% never pass 100, and 87.9% never pass 1,000
(Exstats, Q2 2026). The store will not find this. The videos have to.

## Why this one can travel

The demo is the product. A grid of milk powder where the "3PCS BUNDLE SALE" is
sitting in red at ₱31.1/100g next to a plain single pack in green at
₱20.7/100g needs no voiceover, no explanation and no setup shot. It is legible
in about three seconds with the sound off, which is the only test that matters
on a vertical feed.

The claim underneath it is also true, repeatable, and slightly outrageous,
which is what gets a comment section arguing.

## Shot list (8 seconds, vertical, no talking)

1. **0.0–1.5s** — Shopee search for `gatas` already on screen, thumb scrolling.
   No intro, no logo, no "hey guys".
2. **1.5–2.5s** — Badges pop in. Let the green tick and the red flag land in the
   same frame.
3. **2.5–5.0s** — Pinch-zoom onto one pair: single pack ₱20.7/100g green,
   bundle ₱31.1/100g red. Hold long enough to read both.
4. **5.0–7.0s** — Cut to a second, different category doing the same thing, so
   it reads as a tool and not a one-off coincidence.
5. **7.0–8.0s** — Extension name, one line, gone.

On-screen text, one line at a time, no more than six words each. Something in
the register of "the bundle is more expensive" — flat and factual beats hype
here, because the number is already the hook.

Do not show the install flow. Nobody watches an install flow.

## Channels, in order

1. **TikTok PH.** The primary channel and the reason this idea was chosen over
   the other two. Post the same demo across several categories: milk powder,
   detergent, shampoo, rice, tissue, vitamins. Each category is its own video,
   not a compilation.
2. **Facebook groups.** PH budgeting, "sulit finds" and reselling groups are
   where this crowd actually is. Post the screenshot, not the link, and put the
   link in the first comment.
3. **Reddit.** r/Philippines and r/phinvest, written as a person who built a
   thing, not as an announcement. Load `reddit-voice` before writing that post.

## Gate (set now, before enthusiasm sets in)

**Day 14 after the first video:** at least 300 installs, or at least one video
past 50k views. Miss both and the problem is the demo, not the code, so recut
the video before touching the parser.

**Day 30:** at least 1,000 installs or a 4.5+ rating from 10+ reviews. Miss both
and take one repositioning attempt — a different category framing — then stop
and write down why.

Prewritten kill conditions: a Chrome Web Store policy strike, a trademark
complaint from either marketplace, or both gates failing.

## Open tuning question (decide with real feedback, not a guess)

On a live `bear brand powdered milk` search the page came back split: five tiles
in ₱/100g and four in ₱/pc. That happens when a title carries only a size
("300g") versus only a count, and it makes cross-tile comparison harder than it
should be — the whole pitch is one glance.

The alternative is to multiply size by count whenever both appear, so
"33g" plus a count of 16 becomes 528 g and reads ₱40.7/100g, directly
comparable to the 300 g packs. That was tried and deliberately not shipped,
because the same rule turns "Biogesic 500mg 10s" into ₱1,040/100g of
paracetamol — true, and useless.

Neither reading is wrong; both produce correct arithmetic. Ship as-is, watch
what people actually complain about, then pick. Do not guess this one.

## What widening to ten retailers changed, and what it did not

v1.2.0 runs on Amazon, eBay, Walmart, Temu and the rest, in whatever currency
the page uses. That changes the addressable market and nothing about the plan
above. The launch is still PH-first and TikTok-first, because that is the
distribution edge that picked this idea over the other two; a Filipino
extension that also works on Amazon is a better story than an American
extension nobody in the US has a reason to hear about.

The order stands: earn the first thousand installs on Shopee grocery videos,
then cut one English demo on an Amazon coffee search for the store listing and
for Reddit. Do not open a second front before the first gate is passed.

One real consequence: US and UK grocery sites already print unit prices by law,
so shoppers there have seen this idea. Amazon does not print them consistently
on search grids, and marketplaces like Temu, Shein and AliExpress never do.
Those are where the badge is worth something outside the Philippines, and where
any English-language demo should be shot.

## Known risks worth watching

**Review risk on the wider host list.** Ten retailers means a long `matches`
list, which draws more reviewer attention than two domains did. The mitigation
is already in the package: no wildcard hosts, `activeTab` instead of broad
access for everything else, and remote code declared as No. If the update is
rejected, cut the host list to the five biggest and resubmit rather than
arguing.

**DOM churn.** Every one of these stores redeploys without notice, and now
there are ten of them rather than two. The selector-free climb should survive
most redesigns, but not all. If badges vanish, run
`test/fixture.html` first to confirm the parser is fine, then look at the live
DOM.

**Title parsing on real listings.** The test set is 83 assertions of formats I
could think of. Real Shopee titles are worse. Collect the misses: a listing
that should badge and does not is a missing pattern; a listing that badges
*wrongly* is urgent and should be fixed the same day, because that is what
earns one-star reviews.

**Coverage on a mixed search.** Unit price is meaningful for groceries and
consumables. On a general search — clothes, phone cases, gadgets — most tiles
will correctly show nothing. That is the design working, but it looks like the
extension is broken to someone who installed it after a grocery video. The
store description should set that expectation, and it does.
