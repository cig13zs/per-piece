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

## Known risks worth watching

**DOM churn.** Shopee and Lazada redeploy without notice. The selector-free
climb should survive most redesigns, but not all. If badges vanish, run
`test/fixture.html` first to confirm the parser is fine, then look at the live
DOM.

**Title parsing on real listings.** The test set is 47 assertions of formats I
could think of. Real Shopee titles are worse. Collect the misses: a listing
that should badge and does not is a missing pattern; a listing that badges
*wrongly* is urgent and should be fixed the same day, because that is what
earns one-star reviews.

**Coverage on a mixed search.** Unit price is meaningful for groceries and
consumables. On a general search — clothes, phone cases, gadgets — most tiles
will correctly show nothing. That is the design working, but it looks like the
extension is broken to someone who installed it after a grocery video. The
store description should set that expectation, and it does.
