const box = document.getElementById('t');
const btn = document.getElementById('report');
const scanBtn = document.getElementById('scan');
const msg = document.getElementById('msg');

const ISSUES = 'https://github.com/cig13zs/per-piece/issues/new';
const MAX_ROWS = 12;   // keep a report readable; the misses matter most

const massSel = document.getElementById('mass');
const volSel = document.getElementById('volume');

chrome.storage.local.get({ enabled: true, units: {} }, (s) => {
  box.checked = s.enabled;
  if (s.units.mass) massSel.value = s.units.mass;
  if (s.units.volume) volSel.value = s.units.volume;
});

box.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: box.checked });
});

// Badges on open shop tabs redraw in the new unit through storage.onChanged.
const saveUnits = () => chrome.storage.local.set({ units: { mass: massSel.value, volume: volSel.value } });
massSel.addEventListener('change', saveUnits);
volSel.addEventListener('change', saveUnits);

const tab = () => chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => t);

// Run on a shop we do not list. Opening this popup is what grants activeTab, so
// nothing here can touch a page the user did not just ask about. On a listed
// site the script is already running, so we only nudge it to rescan - injecting
// parse.js twice would throw on its top-level consts.
scanBtn.addEventListener('click', async () => {
  scanBtn.disabled = true;
  msg.textContent = '';
  try {
    const target = { tabId: (await tab()).id };
    const [{ result: live }] = await chrome.scripting.executeScript(
      { target, func: () => !!window.__perPieceScan });

    if (live) {
      await chrome.scripting.executeScript({ target, func: () => window.__perPieceScan() });
    } else {
      await chrome.scripting.insertCSS({ target, files: ['content.css'] });
      await chrome.scripting.executeScript({ target, files: ['parse.js', 'content.js'] });
    }
    msg.textContent = 'Scanned. Badges appear where a size could be read.';
    setTimeout(loadCheapest, 600);   // the scan is debounced on the page
  } catch {
    msg.textContent = 'Chrome will not let extensions run on this page.';
  }
  scanBtn.disabled = false;
});

// "Cheapest on this page": one row per unit and currency, each with a Show
// button that scrolls the shop page to that tile. Titles come from the page,
// so they are written as text, never as HTML.
const cheapBox = document.getElementById('cheap');
const cheapList = document.getElementById('cheap-list');

async function loadCheapest() {
  let list;
  try {
    list = await chrome.tabs.sendMessage((await tab()).id, { type: 'pp-cheapest' });
  } catch { list = null; }
  cheapList.replaceChildren();
  cheapBox.hidden = !Array.isArray(list) || !list.length;
  if (cheapBox.hidden) return;
  list.slice(0, 4).forEach((c, i) => {
    const li = document.createElement('li');
    const what = document.createElement('span');
    what.className = 'what';
    const unit = document.createElement('b');
    unit.textContent = c.unit;
    what.append(unit, c.title);
    what.title = `${c.title}, ${c.price}. Cheapest of ${c.count} priced per ${c.unit.split('/').pop()}.`;
    const show = document.createElement('button');
    show.type = 'button';
    show.textContent = 'Show';
    show.setAttribute('aria-label', `Show ${c.title}`);
    show.addEventListener('click', async () => {
      try {
        const ok = await chrome.tabs.sendMessage((await tab()).id, { type: 'pp-show', index: i });
        if (!ok) msg.textContent = 'That tile is gone. Scan the page again.';
      } catch {
        msg.textContent = 'Reload the shop page and try again.';
      }
    });
    li.append(what, show);
    cheapList.append(li);
  });
}

loadCheapest();

const rows = (list) => list.slice(0, MAX_ROWS)
  .map((r) => `- ${r.title}  |  ${r.price}${r.unit ? `  ->  ${r.unit}` : ''}`)
  .join('\n');

function body(d) {
  const out = [`Page: ${d.url}`, ''];
  out.push('### What looked wrong', '', '<!-- Which product, and what did you expect? -->', '');
  if (d.miss.length) {
    out.push(`### No badge shown (${d.miss.length})`, '', rows(d.miss), '');
  }
  if (d.hidden.length) {
    out.push(`### Hidden as out of line with the page (${d.hidden.length})`, '', rows(d.hidden), '');
  }
  if (d.ok.length) {
    out.push(`### Badged (${d.ok.length})`, '', rows(d.ok), '');
  }
  out.push('---', 'Built by the extension when the button was pressed. No browsing history is included.');
  return out.join('\n');
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  msg.textContent = '';
  try {
    const d = await chrome.tabs.sendMessage((await tab()).id, { type: 'pp-report' });
    if (!d) throw new Error('no data');

    const text = body(d);
    // Clipboard first: whoever has no GitHub account can still paste this
    // into a store review or a message.
    try { await navigator.clipboard.writeText(text); } catch { /* not fatal */ }

    const url = `${ISSUES}?title=${encodeURIComponent('Wrong or missing unit price')}`
      + `&body=${encodeURIComponent(text.slice(0, 6000))}`;
    chrome.tabs.create({ url });
    msg.textContent = 'Report copied and opened on GitHub.';
  } catch {
    msg.textContent = 'Open a shop page and press Scan this page first.';
  }
  btn.disabled = false;
});
