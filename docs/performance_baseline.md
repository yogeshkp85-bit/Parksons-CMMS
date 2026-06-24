# Parksons CMMS Performance Baseline & Benchmarks

This document establishes the performance baseline for the Parksons CMMS application under different traffic profiles. These values serve as the reference benchmark prior to implementing Phase 15 (AI / Predictive Maintenance).

---

## Baseline Performance Metrics

| Metric | Target Baseline | SLA Threshold | Scrape / Source Metric |
| :--- | :--- | :--- | :--- |
| **Average API Response Time** | `< 250ms` | `< 1500ms` | `http_request_duration_seconds` (Average) |
| **P95 API Latency** | `< 650ms` | `< 3000ms` | `http_request_duration_seconds` (95th Percentile) |
| **Average Database Query Duration** | `< 15ms` | `< 100ms` | `prisma_query_duration_ms` (Average) |
| **Socket Connection Capacity** | `1,000+` active | `5,000+` concurrent | `socket_active_connections` (Gauge) |
| **Breakdown Registration Throughput** | `50 req/sec` | `200 req/sec` | `rate(cmms_breakdown_created_total[1m])` |

---

## Benchmark Scenario Expected Latency Profiles

### 1. Normal Load Profile (50 Concurrent Users)
* **Average API Response Time**: `80ms - 150ms`
* **P95 Latency**: `180ms - 290ms`
* **CPU / Memory Consumption**: CPU `< 15%`, RAM `< 40%`
* **Database Connection Pool Size**: 5 connections (stable)

### 2. Heavy Load Profile (200 Concurrent Users)
* **Average API Response Time**: `180ms - 320ms`
* **P95 Latency**: `420ms - 680ms`
* **CPU / Memory Consumption**: CPU `< 35%`, RAM `< 55%`
* **Error Rate**: `0.0%` (Zero failures)

### 3. Stress Profile (500 Concurrent Users)
* **Average API Response Time**: `450ms - 850ms`
* **P95 Latency**: `1200ms - 1900ms`
* **CPU / Memory Consumption**: CPU `< 65%`, RAM `< 70%`
* **Socket Stability**: Socket connections remain active without disconnection spikes.

### 4. Spike Profile (1,000 Concurrent Users)
* **Average API Response Time**: `1.2s - 2.1s`
* **P95 Latency**: `2.8s - 3.4s`
* **CPU / Memory Consumption**: CPU `< 90%`, RAM `< 85%`
* **Error Rate**: `< 1.5%` (Minor socket reconnect retries)

---

## Verification Commands

To trigger k6 baseline verification runs and capture telemetry, execute:
```bash
# Run local performance check against development stack
k6 run -e API_URL=http://localhost:5000/api load-tests/load_test.js
```
