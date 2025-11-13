# Mindous.ai

An AI-powered agent platform built with Next.js 14, TypeScript, Tailwind CSS, ShadCN UI, Supabase, Drizzle ORM, and Clerk authentication.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router, React Server Components) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, ShadCN UI, Framer Motion |
| **Backend** | Supabase (PostgreSQL) with Drizzle ORM |
| **Auth** | Clerk |
| **Deployment** | Vercel |

## Prerequisites

Before you begin make sure you have:

1. **Node.js ≥ 18**
2. **Git** and a **GitHub** account
3. **Supabase** account (free tier ok)
4. **Clerk** account
5. **Vercel** account

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Open `.env.local` and provide the following keys:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://<user>:<password>@db.<project>.supabase.co:6543/postgres"

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
```

> Keep `.env.local` **private** – never commit it to Git!

### 3. Run Locally

```bash
npm run dev
# Visit http://localhost:3000
```

## Project Structure

```
.
├── actions/           # Server actions
├── app/               # Next.js app router structure
├── components/        # UI components (ShadCN based)
├── db/                # Drizzle config & migrations
├── lib/               # Utility helpers
└── types/             # TypeScript type definitions
```

## Database Scripts

```bash
npm run db:generate    # Generate Drizzle migrations
npm run db:migrate     # Run migrations
```

## Deployment

1. Push your code to GitHub
2. Log into [Vercel](https://vercel.com/) and **Import Project**
3. During setup, add the same environment variables from `.env.local` to Vercel
4. Click **Deploy** – Vercel will build and deploy your app

## License

Distributed under the MIT License.
