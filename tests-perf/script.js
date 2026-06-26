import http from "k6/http";
import { sleep, check } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options = {
  duration: "30s",
  vus: 1,
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<500"], // 95 percent of response times must be below 500ms
  },
};

export default function () {
  // Health check
  const API_BASE = "http://localhost:8081";
  const healthRes = http.get(`${API_BASE}/api/health`);
  check(healthRes, {
    "health check status is 200": (r) => r.status === 200,
  });

  // Create a new bug
  const payload = JSON.stringify({
    title: `Test Bug ${Date.now()}`,
    description: "This is a test bug created by k6",
    priority: "Medium",
    status: "Open",
  });

  const headers = { "Content-Type": "application/json" };

  const createBugRes = http.post(`${API_BASE}/api/bugs`, payload, { headers });

  check(createBugRes, {
    "create bug status is 201": (r) => r.status === 201,
    "bug has an id": (r) => {
      try {
        const body = r.body || "";
        const parsed = body ? JSON.parse(body) : {};
        return parsed.id !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(5);
}

export function handleSummary(data) {
  return {
    "perf-results.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
