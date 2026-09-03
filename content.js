/* Per Piece - finds product tiles and badges them with a unit price.
 *
 * Deliberately selector-free. Shopee and Lazada ship obfuscated, frequently
 * rotated class names, so anything built on ".shopee-search-item-result__item"
 * dies on their next deploy. Instead we find prices by their text shape and
 * climb to the smallest ancestor that still contains exactly one price - that
 * ancestor is the product tile on any layout.
 */
(() => {
  const MARK = 'data-pp';            // tile already processed
  const BADGE = 'pp-badge';
  const MAX_CLIMB = 12;
  // Kept in step with PRICE_RE in parse.js - see the note there on bare "p".
  const PRICE_TEXT = /(?:₱\s*|\bphp\s*|\bp(?=\d))[\d][\d,]*(?:\.\d{1,2})?/i;

  let enabled = true;
  let timer = null;

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
      if (!p || struck(p) || p.closest(`.${BADGE}`)) continue;
      out += n.nodeValue;
    }
    return out;
  }

  // Cheap prefilter first: only elements already shaped like a price get the
  // tree walk. Keeps a full-page scan linear on a 60-tile grid.
  const maybePrice = (el) => {
    const t = el.textContent;
    return !!t && t.length <= 48 && PRICE_TEXT.test(t);
  };

  function isPriceLeaf(el) {
    if (isOurs(el) || el.closest(`.${BADGE}`) || !maybePrice(el)) return false;
    const vt = visibleText(el);
    if (!vt || vt.length > 40 || !PRICE_TEXT.test(vt)) return false;
    for (const c of el.children) {
      if (maybePrice(c) && PRICE_TEXT.test(visibleText(c))) return false;
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
      if (t.length > best.length && !PRICE_TEXT.test(t)) best = t;
    }
    return best.length >= 8 ? best : '';
  }

  function badgeFor(tile, priceEl) {
    const price = parsePrice(visibleText(priceEl));
    if (!price) return null;
    const qty = parseQuantity(titleOf(tile));
    if (!qty) return null;
    return unitPrice(price, qty);
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

    for (const pe of priceElements(document.body)) {
      const tile = tileOf(pe);
      if (seen.has(tile)) continue;
      seen.add(tile);
      const up = badgeFor(tile, pe);
      if (up) found.push({ tile, priceEl: pe, up });
    }

    // Rank within each dimension - comparing ₱/100g against ₱/pc is meaningless.
    const byDim = {};
    for (const f of found) (byDim[f.up.dimension] ||= []).push(f);

    for (const dim of Object.keys(byDim)) {
      const all = byDim[dim];

      // Drop listings whose stated size clearly does not match what is sold,
      // before ranking - otherwise one bad tile defines "best" for the page.
      const believable = plausible(all.map((f) => f.up.value));
      const group = [];
      for (const f of all) {
        if (believable(f.up.value)) group.push(f);
        else clearTile(f.tile);
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
        f.priceEl.insertAdjacentElement('afterend', el);

        if (cls !== 'plain') f.tile.classList.add(`pp-${cls}`);
        f.tile.setAttribute(MARK, key);
      }
    }
  }

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(scan, 350);
  };

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
