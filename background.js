let startTime = null;
let timerInterval = null;
let youtubeTabActive = false;

function startTimer() {
  if (!startTime && !youtubeTabActive) {
    youtubeTabActive = true;
    startTime = Date.now();
  }
}

async function stopTimer() {
  if (!startTime) return;

  // FIX: Clear the interval to prevent memory leak
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const timeSpent = Date.now() - startTime;
  const today = getTodayDate();

  try {
    const data = await chrome.storage.local.get("youtubeTime");
    let allData = data.youtubeTime || {};

    let todayTime = allData[today] || 0;
    todayTime += timeSpent;

    allData[today] = todayTime;

    await chrome.storage.local.set({ youtubeTime: allData });
  } catch (error) {
    console.error("Error updating YouTube time:", error);
  }

  startTime = null;
  youtubeTabActive = false;
}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

// Message listener to provide current session data to popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTimerStatus") {
    const today = getTodayDate();
    chrome.storage.local.get("youtubeTime", (data) => {
      let allData = data.youtubeTime || {};
      let todayTime = allData[today] || 0;
      
      // Calculate current elapsed time in this session
      let currentSessionTime = 0;
      if (startTime && youtubeTabActive) {
        currentSessionTime = Date.now() - startTime;
      }
      
      sendResponse({
        storedTime: todayTime,
        sessionStartTime: startTime,
        currentSessionTime: currentSessionTime,
        isActive: youtubeTabActive
      });
    });
    return true; // Keep channel open for async response
  }
});


// Listen for YouTube tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("youtube.com")) {
    if (changeInfo.status === "complete") {
      startTimer();
    }
  } else {
    stopTimer();
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener(() => {
  stopTimer();
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    let tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.includes("youtube.com")) {
      startTimer();
    } else {
      stopTimer();
    }
  } catch (error) {
    console.error("Error in onActivated:", error);
    stopTimer();
  }
});