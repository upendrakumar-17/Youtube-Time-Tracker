function formatTime(ms) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds %= 60;
  minutes %= 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function updateTime() {
  chrome.storage.local.get(["totalTime"], (result) => {
    let time = result.totalTime || 0;
    document.getElementById("time").textContent = formatTime(time);
  });
}

updateTime();
setInterval(updateTime, 1000); // refresh every second