# Employee Contact Manager – Bi-Directional Sync System
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Google Sheets API](https://img.shields.io/badge/Google-Sheets%20API-34A853?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## 📋 Project Description
A robust, automated **bi-directional synchronization system** that seamlessly connects **Google Sheets** with a **Supabase PostgreSQL** database for managing employee contact information.

This system ensures:
- Data consistency across both platforms  
- Near real-time synchronization  
- Strong data integrity  
- Comprehensive logging and error handling  

---

## ✨ Key Features

| Feature | Description | Implementation |
|------|-----------|---------------|
| Bi-Directional Sync | Automatic sync between Google Sheets ↔ Supabase | Supabase Edge Functions |
| Real-time Updates | Near real-time consistency | 5-minute scheduled sync |
| UUID Generation | Auto unique IDs for records | `gen_random_uuid()` |
| Error Handling | Robust logging & failure handling | Try/catch + audit logs |
| Secure Authentication | Industry-standard security | OAuth 2.0 + JWT |
| Scheduled Automation | Fully hands-off sync | `pg_cron` |
| Data Validation | Input sanitization | Type checks + null handling |
| Audit Logging | Full sync history | `sync_logs` table |
| Conflict Resolution | Smart upsert logic | Email + timestamps |

---
## 🚀 How It Works (High Level)

1. Read employee data from Google Sheets  
2. Validate & sanitize input  
3. Upsert records into Supabase (email-based)  
4. Sync updates back to Google Sheets  
5. Log every operation for auditing  

---


## 🏗️ Tech Stack

### Backend Infrastructure

| Component | Technology | Purpose |
|--------|-----------|--------|
| Database | PostgreSQL 15+ (Supabase) | ACID-compliant data store |
| Serverless | Supabase Edge Functions (Deno) | Sync execution |
| Scheduler | `pg_cron` | Automated jobs |
| API Layer | Supabase REST API | DB interaction |

### APIs & Integrations

| API | Version | Usage |
|---|--------|-----|
| Google Sheets API | v4 | Spreadsheet read/write |
| Supabase REST API | v1 | Database CRUD |
| Edge Functions | – | Custom logic |

### Authentication & Security

| Method | Implementation | Security |
|------|---------------|---------|
| Google Service Account | OAuth 2.0 JSON key | 🔐 High |
| Supabase JWT | Service Role Key | 🔐 High |
| Row Level Security | PostgreSQL RLS | 🔐 Medium |
| Secrets Management | Supabase ENV Vars | 🔐 High |

---

## 📊 System Architecture

### Data Flow

<img width="2198" height="263" alt="image" src="https://github.com/user-attachments/assets/a336ef3a-52cd-426e-8f41-bc08b39766a9" />

### Bidirectional sync(workflow)
<img width="842" height="715" alt="image" src="https://github.com/user-attachments/assets/fc70c307-60f9-4671-b7b9-e676c838c61b" />


---

## 🔄 Sync Strategy

### Phase 1: Google Sheets → Supabase
- Read rows (A:E)
- Skip header
- Validate required fields
- Upsert using email as unique key
- Update sync metadata

### Phase 2: Supabase → Google Sheets
- Fetch all employee records
- Format rows
- Overwrite sheet body (preserve headers)

---

## 🧠 Conflict Resolution

| Scenario | Resolution |
|------|-----------|
| Duplicate email | Update existing record |
| Sheet newer than DB | Sheet wins |
| DB newer than Sheet | DB wins |
| Partial failure | Continue & log |

---

## 🗄️ Database Design

### employee_contacts
- UUID primary key
- Email-based uniqueness
- Timestamp tracking
- Source-aware sync metadata

### sync_logs
- Full audit trail
- Duration & status
- Error diagnostics

---

## 🔐 Security Architecture

### Authentication
- Google OAuth 2.0 (Service Account)
- Supabase JWT (Service Role)

### Authorization
- PostgreSQL Row Level Security
- Write access restricted to Edge Functions

### Data Protection
- TLS 1.2+ in transit
- Encrypted storage at rest
- Secrets stored in Supabase ENV

---

## ⏱ Scheduling & Automation

- `pg_cron` triggers Edge Function every 5 minutes
- Stateless execution
- Auto-scales horizontally

### Author:
RIYA D
