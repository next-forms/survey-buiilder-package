/**
 * Debug helpers for analytics testing
 */

// Check if Google Analytics is loaded and initialized
export const checkGoogleAnalytics = () => {
  console.group('🔍 Google Analytics Status');
  
  // Check if gtag script is loaded
  const gtagScript = document.querySelector('script[src*="googletagmanager.com/gtag"]');
  console.log('GA Script in DOM:', gtagScript ? '✅ Yes' : '❌ No');
  if (gtagScript) {
    console.log('Script URL:', (gtagScript as HTMLScriptElement).src);
  }
  
  // Check if gtag function exists
  console.log('window.gtag exists:', typeof window.gtag === 'function' ? '✅ Yes' : '❌ No');
  
  // Check dataLayer
  console.log('window.dataLayer exists:', Array.isArray(window.dataLayer) ? '✅ Yes' : '❌ No');
  if (window.dataLayer) {
    console.log('dataLayer length:', window.dataLayer.length);
    console.log('Last 5 dataLayer entries:', window.dataLayer.slice(-5));
  }
  
  console.groupEnd();
};

// Check Google Tag Manager status
export const checkGoogleTagManager = () => {
  console.group('🔍 Google Tag Manager Status');
  
  // Check if GTM script is loaded
  const gtmScript = document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
  console.log('GTM Script in DOM:', gtmScript ? '✅ Yes' : '❌ No');
  if (gtmScript) {
    console.log('Script URL:', (gtmScript as HTMLScriptElement).src);
  }
  
  // Check dataLayer
  console.log('window.dataLayer exists:', Array.isArray(window.dataLayer) ? '✅ Yes' : '❌ No');
  if (window.dataLayer) {
    console.log('dataLayer length:', window.dataLayer.length);
  }
  
  console.groupEnd();
};

// Test sending an event
export const testAnalyticsEvent = () => {
  console.group('🧪 Testing Analytics Event');
  
  if (typeof window.gtag === 'function') {
    console.log('Sending test event...');
    window.gtag('event', 'test_event', {
      event_category: 'test',
      event_label: 'manual_test',
      value: 1,
      debug_mode: true
    });
    console.log('✅ Test event sent - check Network tab for requests to google-analytics.com/g/collect');
  } else {
    console.error('❌ gtag is not available');
  }
  
  console.groupEnd();
};

// Show all analytics requests in network tab
export const showAnalyticsRequests = () => {
  console.group('📡 How to view Analytics requests');
  console.log('1. Open DevTools Network tab');
  console.log('2. Filter by "collect" or "google-analytics"');
  console.log('3. Look for requests to:');
  console.log('   - google-analytics.com/g/collect (GA4)');
  console.log('   - google-analytics.com/collect (Universal Analytics)');
  console.log('   - googletagmanager.com/gtm.js (GTM)');
  console.log('4. Click on a request to see the parameters being sent');
  console.groupEnd();
};

// Export debug functions to window for console access
if (typeof window !== 'undefined') {
  (window as any).analyticsDebug = {
    checkGA: checkGoogleAnalytics,
    checkGTM: checkGoogleTagManager,
    testEvent: testAnalyticsEvent,
    showRequests: showAnalyticsRequests,
    checkAll: () => {
      checkGoogleAnalytics();
      checkGoogleTagManager();
      showAnalyticsRequests();
    }
  };
  
  console.log('💡 Analytics Debug Tools Available:');
  console.log('   window.analyticsDebug.checkGA()     - Check Google Analytics status');
  console.log('   window.analyticsDebug.checkGTM()    - Check GTM status');
  console.log('   window.analyticsDebug.testEvent()   - Send a test event');
  console.log('   window.analyticsDebug.checkAll()    - Run all checks');
}