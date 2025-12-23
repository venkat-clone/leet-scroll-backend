# LeetScroll

> Master coding concepts one scroll at a time.

LeetScroll is a mobile-first, TikTok-style application for practicing LeetCode-style questions. Users can scroll through a personalized feed of coding problems, track their progress, and engage with the community in a fun and interactive way.

## Features

- 📱 **Infinite Scroll Feed**: Seamlessly browse coding questions with a smooth, snap-based interface.
- 🎯 **Personalized Recommendations**: Smart feed matches questions to your interests and preferred difficulty levels.
- 📊 **Progress Tracking**: Keep track of your attempts, success rates, and daily streaks.
- 💬 **Community Interaction**: Like, comment, and discuss logic with other developers.
- 🏷️ **Rich Metadata**: Questions are categorized by topic (Arrays, DP, Graphs, etc.), difficulty, and tags.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Testing**: Jest & React Testing Library

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL installed and running locally

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/leet-scoll.git
    cd leet-scoll
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory. You can use `.env.example` as a reference if available, otherwise ensure you have the following variables:

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/leetscroll?schema=public"
    NEXTAUTH_SECRET="your-secret-key"
    NEXTAUTH_URL="http://localhost:3000"
    # Add other provider keys (Google, GitHub, etc.) if needed
    ```

4.  **Database Setup:**
    Sync your Prisma schema with your database:

    ```bash
    npx prisma generate
    npx prisma db push
    ```

    **(Optional) Seed Test Data:**
    To populate the database with users, questions, and engagement data for development:

    ```bash
    npm run test:seed
    ```

### Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev`: Runs the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint.
- `npm run test`: Runs Jest tests.
- `npm run test:seed`: Seeds the database with test data.
- `npm run test:performance`: Runs performance tests on the feed.
- `npm run test:feed-full`: clear db, seeds data and runs performance tests.
- `npm run test:cleanup`: Cleans up test data.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
