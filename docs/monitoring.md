# CMMS Production Monitoring and Logging Strategy

To ensure high availability and clean runtime diagnostics in the AWS production environment, we employ Docker restart policies, container log-rotation mechanisms, and localized application health checks.

---

## 1. Process Management & Auto-Recovery
We leverage the **Docker daemon restart policies** (`restart: always`) mapped in `docker-compose.prod.yml` instead of configuring process managers like PM2 inside backend containers.
* **Benefit**: Reduces Docker image layer size, keeps CPU consumption lightweight, and aligns with standard microservices orchestration patterns.
* **Auto-recovery**: If the backend Node.js process crashes due to unhandled exceptions, the Docker runtime automatically terminates and restarts the container instance.

---

## 2. Container Log Rotation Strategy
To prevent raw stdout/stderr streams from saturating host storage, the production Docker daemon should be configured to automatically rotate container log files.

Create or update `/etc/docker/daemon.json` on the hosting EC2 instance with the following policy:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

* **Max-Size**: 10 Megabytes limit per container log file.
* **Max-File**: Up to 3 historical logs kept. Older log arrays are automatically pruned.

---

## 3. Health Monitoring Endpoints

### Express Backend API
The backend exposes `GET /api/health` providing:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-21T07:00:00.000Z"
}
```
* **Purpose**: This unauthenticated endpoint is polled by both the AWS Application Load Balancer (ALB) and the Docker container healthcheck daemon to verify service availability.

### PostgreSQL Database
The Database container is monitored directly using `pg_isready` inside the container context:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 10s
  timeout: 5s
  retries: 5
```

---

## 4. Future Prometheus & Grafana Integration
When system scale increases, a dedicated monitoring sidecar stack can be deployed:
1. **Metrics Collection**: Integrate the `prom-client` library in the Node.js backend to collect event loops, CPU/Memory stats, and HTTP request metrics at `/metrics`.
2. **Prometheus Node Exporter**: Spun up in a container to capture EC2 host infrastructure metrics (Disk, Memory, Network).
3. **Visualization**: Add a Grafana dashboard container feeding from the Prometheus query engine for real-time alerting chimes.
