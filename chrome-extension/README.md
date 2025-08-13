# Website Change Monitor - Chrome Extension

A powerful Chrome extension that monitors websites for changes and sends webhook notifications with detailed JSON data.

## 🚀 Quick Installation

1. **Download** the `chrome-extension` folder
2. **Open Chrome** → Go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top-right corner)
4. **Click "Load unpacked"** → Select the `chrome-extension` folder
5. **Done!** The extension icon appears in your toolbar

## 📋 How to Use

### Step 1: Configure the Extension
1. Click the extension icon in Chrome toolbar
2. Enter your **webhook URL** (where you want to receive notifications)
3. Choose what to monitor:
   - **All Changes**: Monitor any content changes
   - **Text Changes Only**: Only text modifications
   - **Specific Keywords**: Alert on specific words/phrases
   - **Symbols & Special Characters**: Watch for symbols like $, ⚠️, etc.

### Step 2: Set Monitoring Options
- **Target Element** (optional): CSS selector like `.price`, `#status`, `h1`
- **Keywords**: Comma-separated list like `SALE, ALERT, $, ⚠️, URGENT`
- **Check Interval**: How often to check (1-300 seconds)

### Step 3: Start Monitoring
1. Click **"Start Monitoring"**
2. Navigate to the website you want to monitor
3. The extension will watch for changes and send webhooks automatically

## 📡 Webhook JSON Format

When changes are detected, your webhook receives this JSON:

```json
{
  "event": "website_change_detected",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "url": "https://example.com/page",
    "title": "Page Title",
    "changeType": "all",
    "selector": "body",
    "oldContent": "Previous content...",
    "newContent": "New content...",
    "contentLength": {
      "old": 1250,
      "new": 1300,
      "difference": 50
    },
    "detectedKeywords": ["SALE", "URGENT"],
    "detectedSymbols": ["$", "⚠️", "!"],
    "changeHash": "abc123def"
  },
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "extensionVersion": "1.0.0",
    "pageLoadTime": 1234.56
  }
}
```

## 🎯 Use Cases

- **💰 Price Monitoring**: Track price changes on shopping sites
- **📈 Stock Alerts**: Monitor trading platforms for specific symbols
- **📰 News Tracking**: Get notified when keywords appear in news
- **🔧 Status Pages**: Monitor service status for outages
- **📱 Social Media**: Watch for mentions or hashtags
- **💼 Job Boards**: Alert when new positions are posted
- **🏠 Real Estate**: Monitor property listings
- **📊 Analytics**: Track website metrics changes

## ⚙️ Features

- ✅ **Real-time monitoring** with MutationObserver
- ✅ **Keyword & symbol detection**
- ✅ **CSS selector targeting**
- ✅ **Webhook notifications** with rich JSON data
- ✅ **Visual browser notifications**
- ✅ **Persistent settings** across browser sessions
- ✅ **Works across page navigation**
- ✅ **Spam prevention** with change buffering
- ✅ **Error handling** and retry logic

## 🔧 Advanced Configuration

### CSS Selectors Examples:
- `.price` - Elements with class "price"
- `#status` - Element with ID "status"  
- `h1` - All H1 headings
- `[data-value]` - Elements with data-value attribute
- `.product .price` - Price elements inside product containers

### Keywords Examples:
- `SALE, DISCOUNT, 50% OFF` - Shopping alerts
- `ALERT, WARNING, ERROR` - Status monitoring
- `$, €, £, ¥` - Currency symbols
- `⚠️, 🚨, 📢, 🔥` - Emoji alerts
- `URGENT, BREAKING, NEW` - News monitoring

## 🛠️ Troubleshooting

### Extension Not Loading
- Make sure all files are in the `chrome-extension` folder
- Check that Developer mode is enabled
- Try reloading the extension

### No Webhook Notifications
- Verify webhook URL is correct and accessible
- Check browser console for error messages
- Test webhook URL with a tool like Postman

### Too Many Notifications
- Increase the check interval
- Use more specific keywords
- Target specific elements with CSS selectors

### Missing Changes
- Decrease the check interval
- Verify CSS selector is correct
- Check if the website uses dynamic content loading

## 🔒 Privacy & Security

- ✅ No data stored externally by the extension
- ✅ All monitoring happens locally in your browser
- ✅ Webhook data sent directly to your specified endpoint
- ✅ No tracking or analytics
- ✅ Open source code for transparency

## 🔄 Updates & Maintenance

The extension automatically:
- Saves your settings across browser sessions
- Restarts monitoring when you navigate to new pages
- Handles page refreshes and tab changes
- Provides visual feedback for all actions

## 📞 Support

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify your webhook endpoint is working
3. Try disabling and re-enabling the extension
4. Check that the target website allows content script injection

---

**Ready to monitor websites like a pro? Install the extension and start tracking changes in seconds!** 🚀