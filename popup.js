const box = document.getElementById('t');

chrome.storage.local.get({ enabled: true }, (s) => { box.checked = s.enabled; });

box.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: box.checked });
});
