document.addEventListener('DOMContentLoaded', function() {
    const allowedDomain = 'x.com';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0] ? tabs[0].url : null;
      if (!currentUrl) {
        console.error('No active tab found.');
        return;
      }
      
      const urlObject = new URL(currentUrl);
      const isAllowedSite = urlObject.hostname === allowedDomain && urlObject.pathname !== '/';
      
      const saveUrlButton = document.getElementById('saveUrl');
      const infoElement = document.getElementById('info');
  
      // Check if the button exists before trying to modify its properties
      if (saveUrlButton) {
        saveUrlButton.disabled = !isAllowedSite;
      } else {
        console.error('Save URL button element not found.');
      }
  
      // Enhanced null check and error handling for setting textContent
      if (infoElement) {
        try {
          infoElement.textContent = isAllowedSite ? "" : "Functionality available only on x.com profiles.";
        } catch (error) {
          console.error('Failed to set textContent on info element:', error);
        }
      } else {
        console.log('Info element not found. Message not displayed.');
      }
  
      if (isAllowedSite) {
        displayUrls();
      }
    });
  
    function getLastUrlSegment(url) {
      const urlObject = new URL(url);
      const segments = urlObject.pathname.split('/').filter(Boolean);
      return segments.length ? segments.pop() : urlObject.hostname;
    }
  
    function displayUrls() {
      chrome.storage.local.get({urls: []}, function(items) {
        const urlListElement = document.getElementById('urlList');
        urlListElement.innerHTML = ''; // Clear existing list
        items.urls.forEach(segment => {
          const li = document.createElement('li');
          li.textContent = segment;
  
          const deleteBtn = document.createElement('span');
          deleteBtn.textContent = 'X';
          deleteBtn.className = 'delete-btn';
          deleteBtn.onclick = function() {
            deleteUrl(segment, function() {
              displayUrls();
            });
          };
          li.appendChild(deleteBtn);
          urlListElement.appendChild(li);
        });
      });
    }
  
    function deleteUrl(urlSegment, callback) {
      chrome.storage.local.get({urls: []}, function(items) {
        let urls = items.urls;
        const index = urls.indexOf(urlSegment);
        if (index > -1) {
          urls.splice(index, 1);
          chrome.storage.local.set({urls: urls}, callback);
        }
      });
    }
  
    document.getElementById('saveUrl').addEventListener('click', function() {
      if (!this.disabled) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          const currentUrl = tabs[0].url;
          const urlObject = new URL(currentUrl);
          if (urlObject.hostname === allowedDomain && urlObject.pathname !== '/') {
            const urlSegment = getLastUrlSegment(currentUrl);
            const prefixedUrlSegment = "@" + urlSegment;
            
            chrome.storage.local.get({urls: []}, function(result) {
              let urls = result.urls;
              if (!urls.includes(prefixedUrlSegment)) {
                urls.push(prefixedUrlSegment);
                chrome.storage.local.set({urls: urls}, function() {
                  if (chrome.runtime.lastError) {
                    console.error("Failed to save URL segment: " + chrome.runtime.lastError.message);
                  } else {
                    displayUrls();
                  }
                });
              } else {
                console.log('URL segment already saved: ' + prefixedUrlSegment);
                displayUrls();
              }
            });
          }
        });
      } else {
        alert('This function is not available on this site.');
      }
    });
  });