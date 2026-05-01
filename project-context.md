# Project Context: SousChefWeb (UI Refactor)

## 1. Project Overview
SousChefWeb is an internal, mobile-first web application used for extracting, archiving, and searching professional culinary recipes. We are migrating the frontend from a legacy Streamlit Python app to a modern Next.js architecture.

## 2. The Tech Stack
* **Frontend Framework:** Next.js (App Router preferred).
* **Styling:** Tailwind CSS (Dark-mode, high-end culinary aesthetic).
* **Database:** Supabase (PostgreSQL).
* **Proxy / Routing:** Cloudflare Workers (Handling domain masking and noindex headers).
* **Environment:** Windows PowerShell local development.

## 3. Current State
* **Database:** Fully populated and stable. The migration from Google Sheets to Supabase is complete.
* **Proxy:** Cloudflare Worker is live and routing traffic successfully.
* **UI:** Blank Next.js canvas. We need to build the "Front of House".

## 4. Database Schema (Supabase)
The application relies on a normalized PostgreSQL database.

* **Table: `recipes`**
    * `id` (UUID, Primary Key)
    * `title` (VARCHAR)
    * `category` (VARCHAR - Stores Creator Name)
    * `source_url` (TEXT - Original Instagram Reel link)
    * `instructions_markdown` (TEXT - Full recipe method and notes)
    * `created_at` (TIMESTAMP)

* **Table: `ingredients`**
    * `id` (UUID, Primary Key)
    * `recipe_id` (UUID - Foreign Key linking to recipes.id)
    * `raw_text` (TEXT - e.g., "500 grams water")

## 5. Next Steps for AI Agent
1.  **Read this context document.**
2.  **Establish Database Connection:** Set up the Supabase client in Next.js to securely query the database using server-side fetching.
3.  **Build the Main Dashboard (`app/page.js`):**
    * Create a prominent, responsive search bar.
    * Implement an SQL-driven multi-modal search that scans recipe titles, categories, ingredients, and the markdown instructions.
    * Design a responsive grid of "Ticket" style recipe cards to display the results.
4.  **UI/UX Constraints:** Maintain a dark-mode theme (#0E1117 background, #D35400 accents). Ensure the layout is highly optimized for mobile viewing in a kitchen environment.