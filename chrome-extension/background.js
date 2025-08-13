// Background service worker for Website Change Monitor

console.log('Website Change Monitor background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Website Change Monitor installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.sync.set({
      monitorType: 'all',
      interval: 5,
      isMonitoring: false
    });
  }
});

// Handle tab updates - restart monitoring if needed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when page is completely loaded
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    try {
      // Check if monitoring should be active
      const settings = await chrome.storage.sync.get(['isMonitoring']);
      
      if (settings.isMonitoring) {
        // Get all monitoring settings
        const allSettings = await chrome.storage.sync.get([
          'webhookUrl',
          'monitorType',
          'selector',
          'keywords', 
          'interval'
        ]);
        
        // Only restart if we have a webhook URL
        if (allSettings.webhookUrl) {
          // Small delay to ensure content script is ready
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
              action: 'startMonitoring',
              settings: allSettings
            }).catch(error => {
              console.log('Could not send message to tab:', tabId, error);
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'webhookSent') {
      console.log('Webhook notification received from tab:', sender.tab?.id);
      console.log('Webhook data:', request.data);
      sendResponse({ received: true });
    } else if (request.action === 'monitoringStatus') {
      console.log('Monitoring status update:', request.status);
      sendResponse({ received: true });
    }
  } catch (error) {
    console.error('Error handling runtime message:', error);
    sendResponse({ error: error.message });
  }
});

// Handle extension icon click (popup will open automatically)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});

// Clean up when extension is disabled/removed
chrome.runtime.onSuspend.addListener(() => {
  console.log('Website Change Monitor suspending');
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    console.log('Storage changes detected:', changes);
    
    // If monitoring was turned off, we could notify all tabs here
    if (changes.isMonitoring && !changes.isMonitoring.newValue) {
      console.log('Monitoring disabled globally');
    }
  }
});