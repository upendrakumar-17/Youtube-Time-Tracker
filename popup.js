function formatTime(ms) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds %= 60;
  minutes %= 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function updateDate() {
  const today = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const dateStr = today.toLocaleDateString('en-US', options);
  const dateElem = document.getElementById("date");
  if (dateElem) {
    dateElem.textContent = dateStr;
  }
}

function updateTime() {
  try {
    // Request current timer status from background service worker
    chrome.runtime.sendMessage({ action: "getTimerStatus" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Message error:", chrome.runtime.lastError);
        document.getElementById("time").textContent = "Error";
        return;
      }
      
      if (response && response.storedTime !== undefined) {
        // Calculate total time: stored time + current session elapsed time
        let totalMs = response.storedTime + response.currentSessionTime;
        document.getElementById("time").textContent = formatTime(totalMs);
        
        // Update status
        const statusElem = document.getElementById("status");
        if (statusElem) {
          statusElem.textContent = response.isActive ? "Tracking..." : "Paused";
        }
      } else {
        document.getElementById("time").textContent = "0h 0m 0s";
      }
    });
  } catch (error) {
    console.error("Error updating time:", error);
    document.getElementById("time").textContent = "Error";
  }
}

function resetToday() {
  const confirmed = confirm("Reset today's YouTube time tracker?");
  if (!confirmed) return;

  try {
    const today = getTodayDate();
    chrome.storage.local.get("youtubeTime", (data) => {
      let allData = data.youtubeTime || {};
      delete allData[today];
      chrome.storage.local.set({ youtubeTime: allData }, () => {
        updateTime();
        showNotification("⏱️ Time reset for today!");
      });
    });
  } catch (error) {
    console.error("Error resetting time:", error);
  }
}

function showNotification(msg) {
  const statusElem = document.getElementById("status");
  if (statusElem) {
    statusElem.textContent = msg;
    setTimeout(() => {
      statusElem.textContent = "Tracking...";
    }, 2000);
  }
}

// Initialize
updateDate();
updateTime();
setInterval(updateTime, 1000); // refresh every second

// Add reset button listener
document.getElementById("resetBtn").addEventListener("click", resetToday);