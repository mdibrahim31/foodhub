# Foodiplace / FoodHub - Multi-Portal Food Delivery System

This repository contains the complete source code for **Foodiplace / FoodHub**, an all-in-one Cash-on-Delivery Multi-Portal Food Delivery System built with React, TypeScript, Express, and Supabase.

---

## 🚨 CRITICAL INSTRUCTIONS FOR AI STUDIO & DEVELOPERS

### 1. Database Schema Maintenance (`/supabase/schema.sql`)
- **Single Source of Truth**: The master database schema is located at **`/supabase/schema.sql`**.
- **Mandatory Synchronization**: Whenever you add new features, create new tables, add/modify columns, update indexes, alter trigger functions, or add Row Level Security (RLS) policies, you **MUST IMMEDIATELY UPDATE `/supabase/schema.sql`**.
- **Provide SQL Code in Response**: Whenever a new feature or database change is added that requires running SQL in Supabase, AI Studio **MUST provide the exact SQL code directly in text format in the chat response**, as well as updating **`/supabase/schema.sql`**.
- **Consolidated Master Script**: Do not create separate scattered migration files. All SQL definitions (Extensions, Tables, Triggers, RLS Policies, Indexes, Storage Buckets, and Initial Seed Data) must remain clean and consolidated in **`/supabase/schema.sql`**.

### 2. Setting Up Database in Supabase
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Open **`/supabase/schema.sql`**, copy the entire SQL script, paste it into the SQL Editor, and click **Run**.
4. Retrieve your **Project URL** and **`anon` public key** from Project Settings -> API and connect your app.

---

## 📱 Multi-Portal System Structure

- **Customer Portal**: `customer.html` / `src/customer-main.tsx` - Food ordering, cart, live order tracking & saved addresses.
- **Vendor Dashboard**: `vendor.html` / `src/vendor-main.tsx` - Restaurant profile, weekly opening schedule & menu management.
- **Kitchen Orders Terminal**: `orders.html` / `src/orders-main.tsx` - Live order management, prep time confirmation & cooking status.
- **Delivery Rider App**: `rider.html` / `src/rider-main.tsx` - Interactive map, single-rider proximity dispatch, turn-by-turn GPS & floating cash tracking.
- **Admin Control Panel**: `admin.html` / `src/admin-main.tsx` - Per-KM delivery charges, delivery zones, ads banners, rider fleet approval & system settings.
- **Sub-Admin Operations**: `subadmin.html` / `src/subadmin-main.tsx` - Zone dispatching, rider pause/resume & active order monitoring.
