function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
      '((\\d{1,3}\\.){3}\\d{1,3}))'+
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
      '(\\?[;&a-z\\d%_.~+=-]*)?'+
      '(\\#[-a-z\\d_]*)?$','i');
  return !!pattern.test(str);
}

function fix_url(url) {
  if (!url) return '*://*/*';
  if (!url.includes('://')) url = 'http://' + url;
  let urlObj = new URL(url);
  return "*://" + urlObj.hostname + "/*";
}

function updateLocalStorage(url) {
  chrome.storage.local.get('blocked', function(result) {
      let blocked = result.blocked || [];
      let fixed_url = fix_url(url);
      if (fixed_url == '*://chrome:/*' || blocked.find(item => item.url === fixed_url)) {
          return;
      }
      let scheduleStart = document.querySelector('#schedule-start').value || '00:00';
      let scheduleEnd = document.querySelector('#schedule-end').value || '23:59';
      blocked.push({ url: fixed_url, start: scheduleStart, end: scheduleEnd });
      chrome.storage.local.set({ 'blocked': blocked });
      displayBlockedSites(blocked);
      console.log("Blocked site added:", { url: fixed_url, start: scheduleStart, end: scheduleEnd });
  });
}

function displayBlockedSites(blocked) {
  let blockedListElement = document.querySelector('#blocked-sites');
  blockedListElement.innerHTML = '';
  blocked.forEach(site => {
      let listItem = document.createElement('li');
      listItem.textContent = `${site.url} (from ${site.start} to ${site.end})`;
      blockedListElement.appendChild(listItem);
  });
}

document.querySelector('#blacklist-button').addEventListener('click', () => {
  let url = document.querySelector('#blacklist-url').value;
  if (!url || !validURL(url)) {
      chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
          updateLocalStorage(tabs[0].url);
      });
  } else {
      updateLocalStorage(url);
  }
});

document.querySelector('#whitelist-button').addEventListener('click', () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
      chrome.storage.local.get('blocked', function(result) {
          let blocked = result.blocked || [];
          let fixed_url = fix_url(tabs[0].url);
          blocked = blocked.filter(item => item.url !== fixed_url);
          chrome.storage.local.set({ 'blocked': blocked });
          displayBlockedSites(blocked);
          console.log("Blocked site removed:", fixed_url);
      });
  });
});

chrome.storage.local.get('blocked', function(result) {
  let blocked = result.blocked || [];
  displayBlockedSites(blocked);
});
