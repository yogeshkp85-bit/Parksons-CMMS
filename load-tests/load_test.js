import http from 'k6/http';
import { check, sleep } from 'k6';

// =========================================================================
// k6 Load Test Configuration & Scenarios
// =========================================================================
export const options = {
  scenarios: {
    // 1. Normal Load Scenario (50 VUs)
    normal: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    // 2. Heavy Load Scenario (200 VUs)
    heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      startTime: '2m', // Run sequentially after normal load
    },
    // 3. Stress Scenario (500 VUs)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '3m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
      startTime: '6m',
    },
    // 4. Spike Scenario (1000 VUs)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 1000 },
        { duration: '30s', target: 1000 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '30s',
      startTime: '13m',
    },
  },

  // Performance Benchmarking Thresholds
  thresholds: {
    http_req_failed: ['rate<0.05'], // Error rate must be less than 5%
    http_req_duration: ['p(95)<3000', 'avg<1500'], // P95 latency < 3s, Average < 1.5s
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

// =========================================================================
// Virtual User (VU) Execution Lifecycle
// =========================================================================
export default function () {
  // Step 1: Health Check (unauthenticated endpoint)
  const healthRes = http.get(`${BASE_URL.replace('/api', '')}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // Step 2: Login Request (simulate authenticating a technician)
  const loginPayload = JSON.stringify({
    email: 'admin@parksons.com',
    password: 'password123',
  });

  const headers = { 'Content-Type': 'application/json' };
  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, { headers });
  
  const loginSuccess = check(loginRes, {
    'login successful (200)': (r) => r.status === 200,
    'has token': (r) => r.json().data && r.json().data.token !== undefined,
  });

  if (loginSuccess) {
    const token = loginRes.json().data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Step 3: Fetch Pending Breakdowns
    const breakdownsRes = http.get(`${BASE_URL}/breakdowns/pending`, { headers: authHeaders });
    check(breakdownsRes, {
      'pending breakdowns returned (200)': (r) => r.status === 200,
    });
    sleep(2);

    // Step 4: Fetch Reports Dashboard
    const dashboardRes = http.get(`${BASE_URL}/reports/dashboard`, { headers: authHeaders });
    check(dashboardRes, {
      'dashboard reports returned (200)': (r) => r.status === 200,
    });
    sleep(2);
  }

  sleep(1);
}
