//const initialDate = document.getElementById('initial-date');
const runBtn = document.getElementById('run-btn');

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

runBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content-script.js'],
  });
});
/*
function showAlert(givenName) {
  alert(`Hello, ${givenName}`);
}

injectFunction.addEventListener('click', async () => {
  const tab = await getCurrentTab();

  const name = 'World';
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: showAlert,
    args: [name]
  });
});
*/