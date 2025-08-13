document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const webhookUrlInput = document.getElementById('webhookUrl');
  const monitorTypeSelect = document.getElementById('monitorType');
  const selectorInput = document.getElementById('selector');
  const keywordsInput = document.getElementById('keywords');
  const intervalInput = document.getElementById('interval');
  const toggleButton = document.getElementById('toggleMonitoring');
  const statusDiv = document.getElementById('status');

  // Load saved settings from Chrome storage
  try {
    const settings = await chrome.storage.sync.get([
      'webhookUrl',
      'monitorType', 
      'selector',
      'keywords',
      'interval',
      'isMonitoring'
    ]);

    // Populate form with saved values
    webhookUrlInput.value = settings.webhookUrl || '';
    monitorTypeSelect.value = settings.monitorType || 'all';
    selectorInput.value = settings.selector || '';
    keywordsInput.value = settings.keywords || '';
    intervalInput.value = settings.interval || 5;

    // Update UI based on monitoring status
    updateStatus(settings.isMonitoring || false);
  } catch (error) {
    console.error('Error loading settings:', error);
  }

  // Handle start/stop monitoring button click
  toggleButton.addEventListener('click', async () => {
    try {
      const currentSettings = await chrome.storage.sync.get(['isMonitoring']);
      
      if (currentSettings.isMonitoring) {
        await stopMonitoring();
      } else {
        await startMonitoring();
      }
    } catch (error) {
      console.error('Error toggling monitoring:', error);
      alert('Error: ' + error.message);
    }
  });

  // Start monitoring function
  async function startMonitoring() {
    // Validate webhook URL
    const webhookUrl = webhookUrlInput.value.trim();
    if (!webhookUrl) {
      alert('Please enter a webhook URL');
      webhookUrlInput.focus();
      return;
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      alert('Please enter a valid webhook URL (must start with http:// or https://)');
      webhookUrlInput.focus();
      return;
    }

    // Prepare settings object
    const settings = {
      webhookUrl: webhookUrl,
      monitorType: monitorTypeSelect.value,
      selector: selectorInput.value.trim(),
      keywords: keywordsInput.value.trim(),
      interval: Math.max(1, Math.min(300, parseInt(intervalInput.value) || 5)),
      isMonitoring: true
    };

    // Save settings to Chrome storage
    await chrome.storage.sync.set(settings);
    
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      alert('No active tab found. Please open a website to monitor.');
      return;
    }

    // Send message to content script to start monitoring
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'startMonitoring',
        settings: settings
      });
      
      updateStatus(true);
      console.log('Monitoring started for:', tab.url);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      alert('Could not start monitoring. Please refresh the page and try again.');
      await chrome.storage.sync.set({ isMonitoring: false });
    }
  }

  // Stop monitoring function
  async function stopMonitoring() {
    // Update storage
    await chrome.storage.sync.set({ isMonitoring: false });
    
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      try {
        // Send message to content script to stop monitoring
        await chrome.tabs.sendMessage(tab.id, {
          action: 'stopMonitoring'
        });
      } catch (error) {
        console.log('Content script not available:', error);
      }
    }

    updateStatus(false);
    console.log('Monitoring stopped');
  }

  // Update UI status
  function updateStatus(isMonitoring) {
    if (isMonitoring) {
      statusDiv.textContent = '✅ Monitoring: Active';
      statusDiv.className = 'status active';
      toggleButton.textContent = 'Stop Monitoring';
      toggleButton.className = 'btn btn-danger';
    } else {
      statusDiv.textContent = '❌ Monitoring: Inactive';
      statusDiv.className = 'status inactive';
      toggleButton.textContent = 'Start Monitoring';
      toggleButton.className = 'btn btn-primary';
    }
  }

  // Auto-save settings when changed
  [webhookUrlInput, monitorTypeSelect, selectorInput, keywordsInput, intervalInput].forEach(element => {
    element.addEventListener('change', async () => {
      try {
        const currentSettings = await chrome.storage.sync.get();
        await chrome.storage.sync.set({
          ...currentSettings,
          webhookUrl: webhookUrlInput.value.trim(),
          monitorType: monitorTypeSelect.value,
          selector: selectorInput.value.trim(),
          keywords: keywordsInput.value.trim(),
          interval: parseInt(intervalInput.value) || 5
        });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    });
  });
});