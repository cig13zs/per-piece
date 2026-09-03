const box = document.getElementById('t');
const btn = document.getElementById('report');
const scanBtn = document.getElementById('scan');
const msg = document.getElementById('msg');

const ISSUES = 'https://github.com/cig13zs/per-piece/issues/new';
const MAX_ROWS = 12;   // keep a report readable; the misses matter most

chrome.storage.local.get({ enabled: true }, (s) => { box.checked = s.enabled; });

box.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: box.checked });
});

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
  } catch {
    msg.textContent = 'Chrome will not let extensions run on this page.';
  }
  scanBtn.disabled = false;
});

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
