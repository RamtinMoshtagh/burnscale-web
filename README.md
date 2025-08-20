# Burnscale
<img width="1192" height="1075" alt="Screenshot 2025-08-20 at 11 10 04" src="https://github.com/user-attachments/assets/449af5a4-9aca-41d0-bbe8-d4b29cc2c6fb" />

*A lightweight, privacy-first way to spot burnout early and act with data.*

## What it is
- **Daily micro-check-ins** (30–60s) that track energy, stress, focus, and recovery.
- A single **Burnscale score (0–100)** with trend arrows and weekly deltas.
- **Signals**: workload, sleep/fitness imports (optional), calendar load, notes.
- **Nudges & rituals**: configurable breaks, shutdown routines, and focus blocks.
- **Team view (optional)**: anonymized aggregates; no individual spying.

## How it works (brief)
1. Log a quick check-in (or auto-ingest optional signals).  
2. Model computes a **risk score** and highlights drivers (↑ workload, ↓ sleep, etc.).  
3. See **trends** and get small, timely **actions** to course-correct.

## Tech
- **Next.js**, **TypeScript**, **Tailwind**
- **Supabase** (Auth, Postgres, Storage) + row-level security
- Optional integrations: Calendar, wearable exports (CSV/Apple Health/Google Fit)

## Privacy & Safety
- **You own your data**; RLS prevents cross-account access.
- Health-adjacent imports are **opt-in** and can be deleted anytime.
- Team mode shows only **aggregated** metrics with k-anonymity thresholds.
