'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Analytics integration (Vercel Analytics, Google Analytics, etc.)
      // Example for Google Analytics (gtag.js)
      // window.gtag?.('event', metric.name, {
      //   value: Math.round(metric.value),
      //   metric_id: metric.id,
      //   metric_delta: metric.delta,
      // });
    }
  });
  
  return null;
}