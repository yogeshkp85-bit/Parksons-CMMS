# Parksons CMMS Disaster Recovery (DR) Protocol

This document details the step-by-step restoration procedures, disaster handling guidelines, and recovery targets for the Parksons CMMS production infrastructure.

---

## Recovery Objectives

* **Recovery Point Objective (RPO)**: **24 Hours** (Maximum acceptable data loss since the last automated database backup).
* **Recovery Time Objective (RTO)**: **1 Hour** (Maximum target downtime allowed to restore full system operation).

---

## Disaster Scenarios & Playbooks

### Scenario 1: EC2 Instance / Host Failure
**Symptoms**: Frontend and backend are completely unreachable; AWS console reports instance state as stopped, terminated, or impaired.

#### Resolution Steps:
1. **Launch a Replacement Instance**:
   * Navigate to the AWS EC2 Console.
   * Launch a new instance using the standard production AMI (Ubuntu 22.04 LTS recommended, `t3.medium` or higher).
   * Ensure the instance is assigned to the production security group (`sg-production-cmms`) allowing ports `80` (HTTP), `443` (HTTPS), and `22` (SSH).
2. **Re-attach Elastic IP**:
   * Under AWS Console > EC2 > Network & Security > Elastic IPs, associate the production Elastic IP to the newly launched EC2 instance to preserve URL DNS mapping.
3. **Redeploy Application Containers**:
   * SSH into the new instance:
     ```bash
     ssh -i production-key.pem ubuntu@<elastic-ip>
     ```
   * Clone the CMMS code repository to the server:
     ```bash
     git clone https://github.com/yogeshkp85-bit/Parksons-CMMS.git /opt/Parksons-CMMS
     cd /opt/Parksons-CMMS
     ```
   * Configure environment variables by copying `.env.production.example` to `.env`:
     ```bash
     cp .env.production.example .env
     # Edit the file with production credentials (JWT Secret, Database Credentials, etc.)
     nano .env
     ```
   * Build and start production stack:
     ```bash
     docker compose -f docker-compose.prod.yml up -d --build
     ```

---

### Scenario 2: Database Corruption / Data Loss
**Symptoms**: Internal server errors (500) on database requests; Prisma connection failures; corrupted schema tables.

#### Resolution Steps:
1. **Stop Node.js Services**:
   * Prevent incoming writes while restoring data:
     ```bash
     docker compose -f docker-compose.prod.yml stop backend
     ```
2. **Locate the Latest Backup**:
   * Access the local backups directory `/opt/Parksons-CMMS/backups/`.
   * Find the newest compressed backup matching `cmms_backup_YYYYMMDD_HHMMSS.sql.gz`.
   * *If the local host was destroyed, retrieve the latest backup from the AWS S3 vault*:
     ```bash
     aws s3 cp s3://parksons-cmms-backups-bucket/database/latest_backup.sql.gz ./backups/
     ```
3. **Execute Restore Procedure**:
   * Run the restore script:
     ```bash
     chmod +x scripts/restore-db.sh
     ./scripts/restore-db.sh ./backups/cmms_backup_<latest_timestamp>.sql.gz
     ```
4. **Restart Services**:
   * Bring the backend service back online:
     ```bash
     docker compose -f docker-compose.prod.yml start backend
     ```
   * Check logs to verify correct operation:
     ```bash
     docker compose -f docker-compose.prod.yml logs -f backend
     ```

---

### Scenario 3: Full Docker Environment Redeployment
**Symptoms**: Container daemon crashes, volume corruptions, or broken network interfaces.

#### Resolution Steps:
1. **Prune Troubled Docker Objects**:
   ```bash
   # Caution: This will remove stopped containers, networks, and dangling volumes
   docker system prune -a --volumes --force
   ```
2. **Rebuild the Images from Source**:
   ```bash
   docker compose -f docker-compose.prod.yml build --no-cache
   ```
3. **Initialize and Up Services**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
4. **Run DB Migrations Check**:
   * Ensure database schemas match:
     ```bash
     docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
     ```

---

## Verification Checklist post-DR

- [ ] **Ping Check**: Verify `GET http://<domain>/api/health` returns status `200 OK`.
- [ ] **Web Portal Access**: Verify the login screen loads and user credentials work.
- [ ] **Socket Notifications**: Trigger a mock breakdown; verify real-time alerts function.
- [ ] **Database Integrity**: Navigate through historic breakdown logs to verify recent logs exist.
