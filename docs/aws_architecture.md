# AWS Production Architecture Setup

This document outlines the production architecture design for deploying the Parksons CMMS application on AWS, ensuring security, scalability, and ease of maintenance.

---

## Infrastructure Topology

The system uses a single EC2 Instance running Docker Compose for simplified deployment, placed behind an Application Load Balancer (ALB) for SSL termination, and managed by Route53 for DNS resolution.

```
Internet ──> Route53 ──> Application Load Balancer (ALB) [HTTPS Port 443]
                                     │
                                     ▼ [HTTP Port 80]
                             EC2 Instance (Ubuntu 24.04 LTS)
                                     │
                                     ▼ Docker Compose Network
                       ┌─────────────┴─────────────┐
                       │                           │
                       ▼                           ▼
                     Nginx (Reverse Proxy) ──> Frontend (Nginx Static Host)
                       │
                       ▼
                     Backend API (Node 22)
                       │
                       ▼
                     PostgreSQL Database (Docker Volume)
```

---

## Security Groups & Open Ports

Security groups are configured with the Principle of Least Privilege:

### 1. Application Load Balancer (ALB) Security Group
* **Inbound Rules**:
  * Allow HTTP (Port 80) from `0.0.0.0/0` (Redirects to HTTPS).
  * Allow HTTPS (Port 443) from `0.0.0.0/0`.
* **Outbound Rules**:
  * Allow all traffic to EC2 Security Group on Port 80.

### 2. EC2 Instance Security Group
* **Inbound Rules**:
  * Allow HTTP (Port 80) only from the ALB Security Group.
  * Allow SSH (Port 22) only from trusted admin Bastion/Office IP addresses.
* **Outbound Rules**:
  * Allow all outbound traffic (for updates, package installations, and Docker builds).

---

## SSL/TLS Strategy
* **SSL Termination**: Handled entirely at the Application Load Balancer (ALB).
* **Certificate Management**: AWS Certificate Manager (ACM) provisions, manages, and automatically renews the SSL certificates.
* **Internal Routing**: Traffic between the ALB and the EC2 instance inside the VPC runs over HTTP (Port 80).

---

## Backup Strategy
1. **Database Backups**: An automated script (`scripts/backup-db.sh`) runs nightly via a cron job on the EC2 instance. It dumps the database, compresses it with gzip, and securely uploads it to an AWS S3 bucket.
2. **S3 Lifecycles**: Backups are transitioned to S3 Glacier Deep Archive after 30 days and deleted after 365 days.
3. **Volume Backups**: AWS Backup manages daily snapshots of the EC2 instance's EBS root volume for full disaster recovery.

---

## Upgrade Procedure
When deploying updates to production:
1. SSH into the production EC2 instance.
2. Pull latest code from the deployment branch.
3. Build new Docker images and restart containers:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. Run pending database migrations:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```
5. Prune old, unused Docker layers to save disk space:
   ```bash
   docker image prune -f
   ```
