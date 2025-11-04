/**
 * K6 Stress Testing for TTS Adapter Operations
 * Tests system limits and failure modes under extreme load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics for stress testing
const StressSynthesisRate = new Rate('stress_synthesis_rate');
const SystemErrors = new Rate('system_errors');
const MemoryUsage = new Rate('memory_usage');

export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Warm up
    { duration: '2m', target: 50 }, // Increase load
    { duration: '5m', target: 100 }, // High load
    { duration: '5m', target: 200 }, // Stress level
    { duration: '2m', target: 500 }, // Extreme stress
    { duration: '5m', target: 0 }, // Cool down
  ],
  thresholds: {
    // Relaxed thresholds for stress testing
    http_req_duration: ['p(95)<10000'], // 95% under 10 seconds
    http_req_failed: ['rate<0.3'], // Allow up to 30% errors under stress
    stress_synthesis_rate: ['rate>3'], // Minimum 3 wps under stress
  },
};

const stressTestTexts = [
  'Brief stress test.',
  'Medium length stress test text with moderate complexity for system validation.',
  'Extended stress test text designed to push system resources to their limits. This contains multiple complex sentences and should help identify breaking points, memory leaks, and performance degradation patterns under extreme load conditions.',
];

export default function () {
  const text =
    stressTestTexts[Math.floor(Math.random() * stressTestTexts.length)];

  const startTime = new Date().getTime();
  const words = text.split(' ').length;

  // Test TTS adapter under stress conditions
  const response = http.post(
    'http://localhost:3000/api/tts/synthesize',
    JSON.stringify({
      text: text,
      voice: 'stress-test-voice',
      language: 'en-US',
      format: 'mp3',
      // Add stress-specific options
      priority: 'low', // Test queuing behavior
      timeout: 30000, // Extended timeout for stress conditions
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Stress-Test': 'true',
      },
      timeout: '30s',
    }
  );

  const endTime = new Date().getTime();
  const synthesisTime = endTime - startTime;
  const wordsPerSecond = words / (synthesisTime / 1000);

  StressSynthesisRate.add(wordsPerSecond);

  if (response.status >= 500) {
    SystemErrors.add(1);
    console.log(
      `System error detected: ${response.status} ${response.status_text}`
    );
  }

  // Check system resilience under stress
  const stressChecks = {
    'System responds (even with errors)': (r) => r.response.status < 600,
    'No timeout errors': (r) => r.response.status !== 0,
    'Synthesis completes under 30s': (r) => r.synthesisTime < 30000,
    'Minimum performance maintained': (r) => r.wordsPerSecond >= 1,
  };

  check({ response, synthesisTime, wordsPerSecond }, stressChecks);

  // Reduced pause for stress testing
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 second pause
}

export function handleSummary(data) {
  return {
    'TTS Adapter Stress Test Summary': {
      'Peak Load RPS': data.metrics.http_reqs.rate,
      'System Error Rate': `${(data.metrics.system_errors.avg * 100).toFixed(2)}%`,
      'Average Response Time': `${data.metrics.http_req_duration.avg}ms`,
      '95th Percentile Response Time': `${data.metrics.http_req_duration['p(95)']}ms`,
      'Synthesis Rate Under Stress': `${data.metrics.stress_synthesis_rate.avg} wps`,
      'Total Requests': data.metrics.http_reqs.count,
      'Failed Requests': data.metrics.http_req_failed.count,
    },
    'System Resilience Analysis': {
      'Performance Degradation':
        data.metrics.http_req_duration.avg > 5000 ? 'Significant' : 'Moderate',
      'Error Recovery':
        data.metrics.system_errors.avg < 0.1 ? 'Good' : 'Needs Improvement',
      'Load Capacity': data.metrics.http_reqs.rate > 100 ? 'High' : 'Limited',
    },
  };
}
