const box = document.getElementById('t');
const btn = document.getElementById('report');
const msg = document.getElementById('msg');

const ISSUES = 'https://github.com/cig13zs/per-piece/issues/new';
const MAX_ROWS = 12;   // keep a report readable; the misses matter most

chrome.storage.local.get({ enabled: true }, (s) => { box.checked = s.enabled; });

box.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: box.checked });
});

const rows = (list) => list.slice(0, MAX_ROWS)
  .map((r) => `- ${r.title}  |  ₱${r.price}${r.unit ? `  ->  ${r.unit}` : ''}`)
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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const d = await chrome.tabs.sendMessage(tab.id, { type: 'pp-report' });
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
    msg.textContent = 'Open a Shopee or Lazada page first, then try again.';
  }
  btn.disabled = false;
});
