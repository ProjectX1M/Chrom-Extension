class WebsiteChangeMonitor {
  constructor() {
    this.isMonitoring = false;
    this.intervalId = null;
    this.previousContent = '';
    this.settings = {};
    this.observer = null;
    this.lastChangeTime = 0;
    this.changeBuffer = 1000; // 1 second buffer to prevent spam
  }

  async init() {
    console.log('Website Change Monitor initialized');
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        if (request.action === 'startMonitoring') {
          this.startMonitoring(request.settings);
          sendResponse({ success: true });
        } else if (request.action === 'stopMonitoring') {
          this.stopMonitoring();
          sendResponse({ success: true });
        }
      } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      }
    });

    // Check if monitoring should be active on page load
    try {
      const stored = await chrome.storage.sync.get(['isMonitoring']);
      if (stored.isMonitoring) {
        const settings = await chrome.storage.sync.get([
          'webhookUrl',
          'monitorType',
          'selector', 
          'keywords',
          'interval'
        ]);
        
        if (settings.webhookUrl) {
          this.startMonitoring(settings);
        }
      }
    } catch (error) {
      console.error('Error checking initial monitoring state:', error);
    }
  }

  startMonitoring(settings) {
    console.log('Starting website monitoring with settings:', settings);
    
    this.settings = settings;
    this.isMonitoring = true;
    
    // Get initial content
    this.previousContent = this.getCurrentContent();
    
    // Start interval checking
    const intervalMs = (settings.interval || 5) * 1000;
    this.intervalId = setInterval(() => {
      this.checkForChanges();
    }, intervalMs);

    // Set up real-time monitoring with MutationObserver
    this.setupMutationObserver();
    
    // Show start notification
    this.showNotification('🔍 Monitoring started for this page', 'success');
  }

  stopMonitoring() {
    console.log('Stopping website monitoring');
    
    this.isMonitoring = false;
    
    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Show stop notification
    this.showNotification('⏹️ Monitoring stopped', 'info');
  }

  setupMutationObserver() {
    // Determine target element
    let targetElement = document.body;
    
    if (this.settings.selector) {
      const customElement = document.querySelector(this.settings.selector);
      if (customElement) {
        targetElement = customElement;
        console.log('Monitoring specific element:', this.settings.selector);
      } else {
        console.warn('Selector not found, monitoring entire page:', this.settings.selector);
      }
    }

    // Create and configure observer
    this.observer = new MutationObserver((mutations) => {
      const now = Date.now();
      
      // Prevent spam by using buffer
      if (now - this.lastChangeTime < this.changeBuffer) {
        return;
      }
      
      let hasRelevantChange = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          hasRelevantChange = true;
        }
      });

      if (hasRelevantChange) {
        this.lastChangeTime = now;
        // Small delay to let DOM settle
        setTimeout(() => this.checkForChanges(), 200);
      }
    });

    // Start observing
    this.observer.observe(targetElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false // Skip attribute changes to reduce noise
    });
  }

  getCurrentContent() {
    let content = '';
    
    try {
      if (this.settings.selector) {
        const element = document.querySelector(this.settings.selector);
        if (element) {
          content = element.textContent || element.innerText || '';
        }
      } else {
        content = document.body.textContent || document.body.innerText || '';
      }
    } catch (error) {
      console.error('Error getting current content:', error);
      content = '';
    }
    
    return content.trim();
  }

  checkForChanges() {
    if (!this.isMonitoring) return;

    try {
      const currentContent = this.getCurrentContent();
      
      // Check if content actually changed
      if (currentContent !== this.previousContent && currentContent.length > 0) {
        const changeData = this.analyzeChange(this.previousContent, currentContent);
        
        if (this.isRelevantChange(changeData)) {
          console.log('Relevant change detected:', changeData);
          this.sendWebhook(changeData);
        }
        
        this.previousContent = currentContent;
      }
    } catch (error) {
      console.error('Error checking for changes:', error);
    }
  }

  analyzeChange(oldContent, newContent) {
    const timestamp = new Date().toISOString();
    const url = window.location.href;
    const title = document.title;
    
    return {
      timestamp,
      url,
      title,
      changeType: this.settings.monitorType,
      selector: this.settings.selector || 'body',
      oldContent: this.truncateText(oldContent, 1000),
      newContent: this.truncateText(newContent, 1000),
      contentLength: {
        old: oldContent.length,
        new: newContent.length,
        difference: newContent.length - oldContent.length
      },
      detectedKeywords: this.extractKeywords(newContent),
      detectedSymbols: this.extractSymbols(newContent),
      changeHash: this.generateChangeHash(oldContent, newContent)
    };
  }

  isRelevantChange(changeData) {
    const monitorType = this.settings.monitorType;
    const keywords = this.settings.keywords;
    
    // If monitoring all changes
    if (monitorType === 'all') {
      return true;
    }
    
    // If monitoring text changes only
    if (monitorType === 'text') {
      return changeData.contentLength.difference !== 0;
    }
    
    // If no keywords specified, monitor all changes
    if (!keywords || keywords.trim() === '') {
      return true;
    }

    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
    const content = changeData.newContent.toLowerCase();
    
    // Check for keyword matches
    if (monitorType === 'keywords') {
      return keywordList.some(keyword => content.includes(keyword));
    }
    
    // Check for symbol matches
    if (monitorType === 'symbols') {
      return keywordList.some(symbol => changeData.newContent.includes(symbol));
    }
    
    return true;
  }

  extractKeywords(content) {
    if (!this.settings.keywords) return [];
    
    const keywordList = this.settings.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const foundKeywords = [];
    
    keywordList.forEach(keyword => {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });
    
    return foundKeywords;
  }

  extractSymbols(content) {
    // Common symbols and special characters
    const symbolRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`⚠️🚨📢💰💸📈📉🔥⭐❗❓⚡🎯🚀💎🏆]/g;
    const symbols = content.match(symbolRegex) || [];
    return [...new Set(symbols)].slice(0, 20); // Limit and remove duplicates
  }

  generateChangeHash(oldContent, newContent) {
    // Simple hash for change identification
    const combined = oldContent + '|' + newContent;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  async sendWebhook(data) {
    try {
      console.log('Sending webhook to:', this.settings.webhookUrl);
      
      const payload = {
        event: 'website_change_detected',
        data: data,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          extensionVersion: '1.0.0',
          pageLoadTime: performance.now()
        }
      };

      const response = await fetch(this.settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Website-Change-Monitor/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('Webhook sent successfully');
        this.showNotification('✅ Change detected! Webhook sent successfully', 'success');
      } else {
        console.error('Webhook failed:', response.status, response.statusText);
        this.showNotification(`❌ Webhook failed: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
      this.showNotification('❌ Webhook error: ' + error.message, 'error');
    }
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.website-monitor-notification');
    existing.forEach(el => el.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'website-monitor-notification';
    
    // Set colors based on type
    let bgColor = '#2196F3'; // info
    if (type === 'success') bgColor = '#4CAF50';
    if (type === 'error') bgColor = '#f44336';
    if (type === 'warning') bgColor = '#FF9800';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 350px;
      word-wrap: break-word;
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
    `;
    
    notification.textContent = message;
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
      notification.remove();
    });
    
    // Add CSS animation
    if (!document.querySelector('#website-monitor-styles')) {
      const style = document.createElement('style');
      style.id = 'website-monitor-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { 
            transform: translateX(100%); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialize the monitor when page loads
const monitor = new WebsiteChangeMonitor();
monitor.init();