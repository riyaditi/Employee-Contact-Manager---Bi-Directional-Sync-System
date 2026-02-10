# Project Overview

## What did I build?

I built a bi-directional data synchronization system between Google Sheets and Supabase to manage employee contact information. The goal of this project was to automate data flow between a Google Sheet (used for easy and collaborative data entry) and a Supabase database (used for structured storage and backend access).

The system uses multiple Supabase Edge Functions to handle different operations such as syncing data from Google Sheets to Supabase, updating Google Sheets from Supabase, and fetching employee data through APIs. Scheduled Edge Functions are used to automate periodic syncing, and Google Service Account authentication is used to securely access the Google Sheets API. All sensitive credentials are managed using Supabase secrets.

Overall, the project demonstrates a backend-only, production-oriented approach to automated data synchronization without relying on any frontend interface.

---

## What use case / real-world problem does it solve?

In many real-world organizations, teams prefer using Google Sheets to maintain data like employee records, QC logs, or contact lists because it is simple and collaborative. However, applications and internal systems usually require this data to be stored in a proper database for querying, analytics, and integrations.

Manually copying or syncing data between Google Sheets and databases often leads to inconsistencies, delays, and human errors. This project solves that problem by automating the synchronization process, ensuring that both Google Sheets and Supabase stay updated and consistent without manual intervention.

---

## Who is the target user of this solution?

- HR or operations teams maintaining employee or contact data in Google Sheets  
- Small to medium-sized teams that rely on spreadsheets but need backend database support  
- Developers who want to build applications on top of spreadsheet-managed data  
- Operations teams managing structured tabular data such as contacts, inventories, or logs  
- Educators or researchers collecting and managing collaborative datasets  

---

# Learnings

## Technical Challenges Faced and How I Solved Them

### Challenge 1: Google Sheets API Authentication Issues
While integrating the Google Sheets API, I faced authentication errors such as “Requested entity not found.” This was mainly due to incorrect formatting of the service account private key and missing permissions. I resolved this by correctly formatting the private key with newline characters, verifying the Sheet ID, and sharing the Google Sheet with the service account email with Editor access.

---

### Challenge 2: Bi-directional Sync Conflicts
Since data could be updated from both Google Sheets and Supabase, handling conflicts became important. I addressed this by using a timestamp-based approach and treating the email field as a unique identifier to determine which record should be updated or merged.

---

### Challenge 3: Edge Function Timeouts
When syncing larger datasets, some Edge Functions were timing out. To solve this, I optimized database queries using indexes, implemented batch processing, and added pagination to handle large sync operations more efficiently.

---

### Challenge 4: Environment Variable and Secret Management
Managing multiple sensitive credentials across different Edge Functions was challenging. I solved this by storing all secrets securely using Supabase Secrets, creating a clear environment variable structure, and adding proper error handling for missing or misconfigured secrets.

---

### Challenge 5: Database Trigger Exploration
I initially explored using PostgreSQL triggers to call Edge Functions on data changes. However, due to Supabase platform restrictions on outbound HTTP calls from the database, this approach was not suitable for production. I redesigned the architecture to move all external API communication into Edge Functions, which aligns with Supabase best practices.

---

## What I Learned from This Task

### Technical Learnings
- Gained hands-on experience with Supabase Edge Functions and serverless backend development  
- Learned how to integrate Google Sheets using Service Account authentication  
- Implemented scheduled automation using Supabase’s built-in cron support  
- Improved understanding of database schema design, indexing, and timestamps  
- Built REST-style backend APIs with proper error handling and logging  
- Learned secure secret management and authentication practices  

---

### Architectural Learnings
- Understood the importance of separating responsibilities across multiple functions  
- Designed fault-tolerant sync workflows with logging and error tracking  
- Learned how to adapt architecture based on platform constraints  
- Considered scalability using batching and pagination  

---

### Process Learnings
- Followed an incremental development approach, starting simple and adding features step by step  
- Learned effective debugging using Supabase logs and detailed console logging  
- Realized the importance of documentation for setup, usage, and troubleshooting  

---

### Conceptual Learnings
- Gained clarity on serverless architecture and its advantages and limitations  
- Learned strategies for maintaining data consistency across distributed systems  
- Understood the value of automation in reducing manual effort and errors  
- Balanced backend complexity with ease of use for non-technical users  

---

### Professional Growth

This project helped me improve my problem-solving approach, backend system design skills, and technical documentation abilities. What started as a simple sync task evolved into a production-ready backend system with proper architecture, security, automation, and monitoring. Overall, this task gave me valuable real-world experience in cloud services integration, serverless development, and system design.
