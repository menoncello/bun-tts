/**
 * K6 Load Testing for TTS Adapter Operations
 * Tests system performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics for TTS performance
const SynthesisRate = new Rate('synthesis_rate');
const ResponseTime = new Rate('response_time');
const ErrorRate = new Rate('error_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 concurrent users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3 seconds
    http_req_failed: ['rate<0.1'], // Error rate below 10%
    synthesis_rate: ['rate>8'], // Minimum 8 words per second
    response_time: ['rate<2000'], // Average response time under 2 seconds
    error_rate: ['rate<0.05'], // Error rate below 5%
  },
};

// Test data
const testTexts = [
  'Short test text for basic performance validation.',
  'This is a medium length test text that contains multiple sentences and should provide a more realistic test of the TTS synthesis performance under normal operating conditions.',
  'This is a much longer test text designed to stress test the TTS adapter system with larger content. It contains multiple sentences with varying complexity and length, which should help identify performance bottlenecks and memory usage patterns during extended synthesis operations. The text is structured to simulate real-world usage scenarios where users might process longer documents or paragraphs.',
];

const voiceOptions = [
  { voice: 'default', language: 'en-US' },
  { voice: 'female', language: 'en-US' },
  { voice: 'male', language: 'en-US' },
];

// Performance testing functions
function measureSynthesisPerformance(text, options = {}) {
  const startTime = new Date().getTime();
  const words = text.split(' ').length;

  // Simulate TTS synthesis API call
  // In real implementation, this would be an actual HTTP request to TTS service
  const response = http.post(
    'http://localhost:3000/api/tts/synthesize',
    JSON.stringify({
      text: text,
      voice: options.voice || 'default',
      language: options.language || 'en-US',
      format: 'mp3',
      quality: 'high',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  const endTime = new Date().getTime();
  const synthesisTime = endTime - startTime;
  const wordsPerSecond = words / (synthesisTime / 1000);

  // Record custom metrics
  SynthesisRate.add(wordsPerSecond);
  ResponseTime.add(synthesisTime);

  if (response.status >= 400) {
    ErrorRate.add(1);
  }

  return {
    response,
    synthesisTime,
    wordsPerSecond,
    wordCount: words,
  };
}

export function setup() {
  // Setup code - initialize test environment
  console.log('Setting up TTS adapter load test environment...');

  // Verify TTS service is available
  const healthCheck = http.get('http://localhost:3000/api/health');

  if (healthCheck.status !== 200) {
    throw new Error('TTS service is not available for load testing');
  }

  console.log('TTS service is ready for load testing');
}

export default function () {
  // Select random test text and voice options
  const text = testTexts[Math.floor(Math.random() * testTexts.length)];
  const voiceOption =
    voiceOptions[Math.floor(Math.random() * voiceOptions.length)];

  // Measure synthesis performance
  const result = measureSynthesisPerformance(text, voiceOption);

  // Validate response
  const checks = {
    'HTTP status is 200': (r) => r.response.status === 200,
    'Response time < 3000ms': (r) => r.synthesisTime < 3000,
    'Synthesis rate > 8 wps': (r) => r.wordsPerSecond >= 8,
    'Response contains audio data': (r) => r.response.body.length > 0,
  };

  check(result, checks);

  // Log performance data
  console.log(
    `Synthesis completed: ${result.wordCount} words in ${result.synthesisTime}ms (${result.wordsPerSecond.toFixed(2)} wps)`
  );

  // Brief pause between requests to simulate realistic usage
  sleep(Math.random() * 2 + 1); // 1-3 second pause
}

export function teardown() {
  // Cleanup code
  console.log('Load test completed. Cleaning up...');
}

// Additional test scenarios
export function handleSummary(data) {
  return {
    'TTS Adapter Load Test Summary': {
      'Total Requests': data.metrics.http_reqs.count,
      'Failed Requests': data.metrics.http_req_failed.count,
      'Average Response Time': data.metrics.http_req_duration.avg,
      '95th Percentile Response Time': data.metrics.http_req_duration['p(95)'],
      'Average Synthesis Rate (wps)': data.metrics.synthesis_rate.avg,
      'Error Rate': data.metrics.error_rate.avg,
      'Peak RPS': data.metrics.http_reqs.rate,
    },
    'Performance Targets': {
      'Target Response Time (95th percentile)': '< 3000ms',
      'Target Synthesis Rate': '> 8 words/second',
      'Target Error Rate': '< 5%',
      'Actual Response Time (95th percentile)': `${data.metrics.http_req_duration['p(95)']}ms`,
      'Actual Synthesis Rate': `${data.metrics.synthesis_rate.avg} wps`,
      'Actual Error Rate': `${(data.metrics.error_rate.avg * 100).toFixed(2)}%`,
    },
  };
}
