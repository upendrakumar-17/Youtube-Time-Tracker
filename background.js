let startTime = null;
let timerInterval = null;

function startTimer() {
  if (!startTime) {
    startTime = Date.now();
    timerInterval = setInterval(() => {
      let timeSpent = Date.now() - startTime;
      chrome.storage.local.get(["totalTime"], (result) => {
        let total = result.totalTime || 0;
        chrome.storage.local.set({ totalTime: total + timeSpent });
      });
      startTime = Date.now();
    }, 1000); // update every second
  }
}

function stopTimer() {
  if (startTime) {
    clearInterval(timerInterval);
    timerInterval = null;

    let timeSpent = Date.now() - startTime;

    chrome.storage.local.get(["totalTime"], (result) => {
      let total = result.totalTime || 0;
      chrome.storage.local.set({ totalTime: total + timeSpent });
    });

    startTime = null;
  }
}

// Listen for YouTube tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("youtube.com")) {
    startTimer();
  }
});

chrome.tabs.onRemoved.addListener(stopTimer);
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  let tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && tab.url.includes("youtube.com")) {
    startTimer();
  } else {
    stopTimer();
  }
});