function blockRequestFunction(details) {
  console.log("Blocking request:", details.url);
  return { cancel: true };
}

function unblock() {
  chrome.webRequest.onBeforeRequest.removeListener(blockRequestFunction);
  console.log("Unblocked all requests.");
}

function block(blackList) {
  const urlsToBlock = blackList.map(item => item.url);
  chrome.webRequest.onBeforeRequest.addListener(
      blockRequestFunction,
      { urls: urlsToBlock },
      ["blocking"]
  );
  console.log("Blocking URLs:", urlsToBlock);
}

function isWithinSchedule(start, end) {
  if (!start || !end) return false;

  const current = new Date();
  const startTime = new Date();
  const endTime = new Date();
  
  const [startHour, startMinute] = start.split(':');
  const [endHour, endMinute] = end.split(':');
  
  startTime.setHours(startHour, startMinute, 0);
  endTime.setHours(endHour, endMinute, 0);
  
  return current >= startTime && current <= endTime;
}

function checkAndUpdateBlockedSites() {
  chrome.storage.local.get(["blocked"], function(data) {
      let blocked = data.blocked || [];
      const currentTime = new Date();
      blocked = blocked.filter(site => {
          const [endHour, endMinute] = site.end.split(':');
          const endTime = new Date();
          endTime.setHours(endHour, endMinute, 0);
          return currentTime < endTime;
      });
      chrome.storage.local.set({ 'blocked': blocked });
      if (blocked.length > 0) {
          block(blocked);
      } else {
          unblock();
      }
  });
}

chrome.storage.local.get(["blocked"], function(data) {
  if (data.blocked) {
      checkAndUpdateBlockedSites();
  }
});

chrome.storage.onChanged.addListener(function(changes) {
  console.log("Storage changed:", changes);
  unblock();
  if (changes.blocked && changes.blocked.newValue.length > 0) {
      checkAndUpdateBlockedSites();
  }
});

// Check periodically to unblock sites after the schedule ends
setInterval(checkAndUpdateBlockedSites, 60000); // Check every minute
