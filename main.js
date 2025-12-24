let skrypt1 = document.getElementById('skrypt1')
skrypt1.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt11.js'],
  });
});
let skrypt2 = document.getElementById('skrypt2')
skrypt2.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt21.js'],
  });
});
let skrypt3 = document.getElementById('skrypt3')
skrypt3.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt31.js'],
  });
});
let skrypt4 = document.getElementById('skrypt4')
skrypt4.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt41.js'],
  });
});
let skrypt5 = document.getElementById('skrypt5')
skrypt5.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt51.js'],
  });
});
let skrypt6 = document.getElementById('skrypt6')
skrypt6.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt61.js'],
  });
});
let skrypt7 = document.getElementById('skrypt7')
skrypt7.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt71.js'],
  });
});
let skrypt8 = document.getElementById('skrypt8')
skrypt8.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt81.js'],
  });
});
let skrypt9 = document.getElementById('skrypt9')
skrypt9.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt91.js'],
  });
});
let skrypt10 = document.getElementById('skrypt10')
skrypt10.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/skrypt101.js'],
  });
});