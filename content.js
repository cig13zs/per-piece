/* Per Piece - finds product tiles and badges them with a unit price.
 *
 * Deliberately selector-free. Shopee and Lazada ship obfuscated, frequently
 * rotated class names, so anything built on ".shopee-search-item-result__item"
 * dies on their next deploy. Instead we find prices by their text shape and
 * climb to the smallest ancestor that still contains exactly one price - that
 * ancestor is the product tile on any layout.
 */
(() => {
  // The popup can inject this file into any tab via activeTab. On a site we
  // already declare the script is here, so just rescan instead of running a
  // second copy - re-injecting parse.js would throw on its top-level consts.
  if (window.__perPieceScan) { window.__perPieceScan(); return; }

  const MARK = 'data-pp';            // tile already processed
  const BADGE = 'pp-badge';
  const MAX_CLIMB = 14;              // deep enough for Amazon and eBay tiles

  let enabled = true;
  let timer = null;

  // Diagnostics for a user-initiated report. Held in memory for this page
  // only: never written to storage, never sent anywhere on its own. The
  // valuable rows are the misses - a tile we priced but could not size.
  let report = { ok: [], miss: [], hidden: [] };

  const isOurs = (el) => el.classList && el.classList.contains(BADGE);

  // getComputedStyle is the expensive call here, so memoise per scan.
  let struckCache = new Map();

  function struck(el) {
    if (struckCache.has(el)) return struckCache.get(el);
    let r = false;
    for (let n = el, i = 0; n && i < 5; n = n.parentElement, i++) {
      const d = getComputedStyle(n).textDecorationLine || '';
      if (d.includes('line-through')) { r = true; break; }
    }
    struckCache.set(el, r);
    return r;
  }

  // Amazon, Walmart and Target print every price twice: once for screen
  // readers and once for eyes, with the visual copy marked aria-hidden and
  // split into symbol / whole / fraction spans that concatenate to "$848".
  // Counting both makes a tile look like it holds two products, so the climb
  // stops dead and nothing is badged. The accessible copy is also the only one
  // with the decimal point in it, so it is the copy worth reading.
  const HIDDEN = `[aria-hidden="true"], .${BADGE}`;

  // Text a shopper actually pays, ignoring struck-out "original" prices and
  // our own badges. Both stores render the old price as a line-through sibling
  // of the current one, sometimes BEFORE it - reading raw textContent would
  // quote the inflated price and every unit price downstream would be wrong.
  function visibleText(el) {
    let out = '';
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const p = n.parentElement;
      if (!p || struck(p) || p.closest(HIDDEN)) continue;
      out += n.nodeValue;
    }
    return out;
  }

  // Cheap prefilter first: only elements already shaped like a price get the
  // tree walk. Keeps a full-page scan linear on a 60-tile grid.
  const maybePrice = (el) => {
    const t = el.textContent;
    return !!t && t.length <= 48 && hasMoney(t);
  };

  // Amazon prints its own rate beside the item price: "PHP 936.28 (PHP 78.08
  // /ounce)". Both are prices by shape, so the tile looks like it holds two
  // products, the climb stops short of the real tile, no title is found and
  // nothing gets badged. What separates them is the text immediately after:
  // a rate is followed by "/ounce". Checking a couple of levels up catches the
  // wrapper, and anchoring the match to the START of that text is what keeps
  // the item price - whose tail is " (PHP 78.08..." - out of it.
  const RATE_TAIL = /^\s*[\/]\s*[a-z]/i;
  const RATE_SELF = /\d\s*[\/]\s*[a-z]/i;

  function isRate(el) {
    for (let n = el, i = 0; n && i < 3; n = n.parentElement, i++) {
      let t = '';
      for (let sib = n.nextSibling; sib && t.length < 12; sib = sib.nextSibling) {
        t += sib.textContent || '';
      }
      if (RATE_TAIL.test(t)) return true;
    }
    return false;
  }

  function isPriceLeaf(el) {
    if (isOurs(el) || el.closest(`.${BADGE}`) || !maybePrice(el)) return false;
    const vt = visibleText(el);
    if (!vt || vt.length > 40 || !hasMoney(vt)) return false;
    if (RATE_SELF.test(vt) || isRate(el)) return false;
    for (const c of el.children) {
      if (maybePrice(c) && hasMoney(visibleText(c))) return false;
    }
    return true;
  }

  function priceElements(root) {
    const out = [];
    for (const el of root.querySelectorAll('*')) if (isPriceLeaf(el)) out.push(el);
    return out;
  }

  const priceCount = (el) => {
    let n = 0;
    for (const c of el.querySelectorAll('*')) if (isPriceLeaf(c)) n++;
    return n;
  };

  // The price we can READ is not always the price the shopper SEES. Amazon's
  // accessible copy is a 1px clipped span sitting at the START of the price
  // block, so hanging the badge off it prints "$2.49/100g $8.48" - backwards.
  // Anchor to the nearest ancestor that actually occupies space instead.
  function shown(el) {
    const cs = getComputedStyle(el);
    // Amazon hides its screen-reader copy with opacity:0, not with clip or a
    // 1px box, and clip does not shrink the layout box anyway - so measuring
    // the rect alone says the hidden copy is 150x32 and visible.
    if (cs.opacity === '0' || cs.visibility === 'hidden') return false;
    if (cs.clip !== 'auto' || cs.clipPath !== 'none') return false;
    const r = el.getBoundingClientRect();
    return r.width >= 8 && r.height >= 8;
  }

  function anchorFor(el) {
    for (let i = 0; i < 3 && el.parentElement && !shown(el); i++) el = el.parentElement;
    return el;
  }

  // Climb while the ancestor still describes a single product.
  function tileOf(priceEl) {
    let el = priceEl.parentElement;
    let best = priceEl;
    for (let i = 0; el && el !== document.body && i < MAX_CLIMB; i++) {
      if (priceCount(el) > 1) break;   // now spans several tiles - too far
      best = el;
      el = el.parentElement;
    }
    return best;
  }

  // The product name: longest text run in the tile that is not a price.
  function titleOf(tile) {
    const w = document.createTreeWalker(tile, NodeFilter.SHOW_TEXT);
    let best = '';
    let n;
    while ((n = w.nextNode())) {
      if (n.parentElement && n.parentElement.closest(`.${BADGE}`)) continue;
      const t = n.nodeValue.trim();
      if (t.length > best.length && !hasMoney(t)) best = t;
    }
    return best.length >= 8 ? best : '';
  }

  function clearTile(tile) {
    tile.querySelectorAll(`.${BADGE}`).forEach((b) => b.remove());
    tile.classList.remove('pp-best', 'pp-worst');
    tile.removeAttribute(MARK);
  }

  function clear() {
    for (const b of document.querySelectorAll(`.${BADGE}`)) b.remove();
    for (const t of document.querySelectorAll(`[${MARK}]`)) {
      t.removeAttribute(MARK);
      t.classList.remove('pp-best', 'pp-worst');
    }
  }

  function scan() {
    if (!enabled) return;
    struckCache = new Map();
    const found = [];
    const seen = new Set();

    report = { ok: [], miss: [], hidden: [] };

    for (const pe of priceElements(document.body)) {
      const tile = tileOf(pe);
      if (seen.has(tile)) continue;
      seen.add(tile);

      const money = parseMoney(visibleText(pe));
      if (!money) continue;
      const title = titleOf(tile);
      const up = unitPrice(money.value, parseQuantity(title), money.symbol);
      const price = formatMoney(money.value, money.symbol);

      if (up) found.push({ tile, priceEl: pe, up, title, price, sym: money.symbol });
      else if (title) report.miss.push({ title, price });
    }

    // Rank within one dimension AND one currency. ₱/100g against ₱/pc is
    // meaningless, and so is $/100g against ₱/100g on a page showing both.
    const byDim = {};
    for (const f of found) (byDim[`${f.up.dimension}|${f.sym}`] ||= []).push(f);

    for (const dim of Object.keys(byDim)) {
      const all = byDim[dim];

      // Drop listings whose stated size clearly does not match what is sold,
      // before ranking - otherwise one bad tile defines "best" for the page.
      const believable = plausible(all.map((f) => f.up.value));
      const group = [];
      for (const f of all) {
        if (believable(f.up.value)) group.push(f);
        else {
          clearTile(f.tile);
          report.hidden.push({ title: f.title, price: f.price, unit: f.up.text });
        }
      }

      const grade = rank(group.map((f) => f.up.value));

      for (const f of group) {
        const cls = grade(f.up.value);
        const prev = f.tile.getAttribute(MARK);
        const key = `${f.up.text}|${cls}`;
        if (prev === key) continue;          // unchanged, leave the DOM alone

        f.tile.querySelectorAll(`.${BADGE}`).forEach((b) => b.remove());
        f.tile.classList.remove('pp-best', 'pp-worst');

        const el = document.createElement('span');
        el.className = `${BADGE} pp-${cls}`;
        el.textContent = f.up.text;
        if (cls === 'best') el.textContent += ' ✓ best';
        if (cls === 'worst') el.title = 'Costs more per unit than the cheapest option on this page';
        anchorFor(f.priceEl).insertAdjacentElement('afterend', el);

        if (cls !== 'plain') f.tile.classList.add(`pp-${cls}`);
        f.tile.setAttribute(MARK, key);
      }

      for (const f of group) {
        report.ok.push({ title: f.title, price: f.price, unit: f.up.text });
      }
    }
  }

  // Answers the popup's "report a wrong price" button. Only ever runs when the
  // user clicks it, and only returns what this page already showed them.
  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (!msg || msg.type !== 'pp-report') return;
    respond({
      // Path only. Query strings on these stores carry session and referral
      // ids that are none of our business.
      url: location.origin + location.pathname,
      ...report,
    });
    return true;
  });

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(scan, 350);
  };

  // Re-entry point for the popup's "Scan this page" button.
  window.__perPieceScan = schedule;

  chrome.storage.local.get({ enabled: true }, (s) => {
    enabled = s.enabled;
    if (enabled) schedule();
  });

  chrome.storage.onChanged.addListener((ch) => {
    if (!ch.enabled) return;
    enabled = ch.enabled.newValue;
    if (enabled) scan(); else clear();
  });

  new MutationObserver((muts) => {
    // Ignore the mutations we caused ourselves, or this never settles.
    for (const m of muts) {
      const t = m.target;
      if (t.nodeType === 1 && (t.classList?.contains(BADGE) || t.closest?.(`.${BADGE}`))) continue;
      schedule();
      return;
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  addEventListener('popstate', schedule);
})();
