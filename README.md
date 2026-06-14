# Mnemo: AI-Powered Spatial Learning

Mnemo is a revolutionary learning platform that transforms your static lecture PDFs and notes into a navigable 3D knowledge universe. Study with AI, visualize concept relationships, and remember everything.

## 🌟 Key Features

- **3D Knowledge Universe**: Navigate your lectures as a living galaxy using `three.js` and `react-three-fiber`. Concepts become nodes, and relationships become beams of light.
- **ATLAS Voice AI**: Speak to Atlas using voice recognition. It understands your memory state, answers questions, and highlights relevant nodes in your 3D universe.
- **Real-time Multiplayer**: Study together in 3D. See your friends' cursors floating in your universe in real time.
- **AR on Any Phone**: Scan a QR code and project your knowledge graph into your physical space using WebAR. No app required.
- **Adaptive Flashcards**: Smart spaced repetition that focuses on the nodes fading in your universe.
- **Memory Analytics**: Visual feedback on your mastery of topics (green, yellow, red indicators).
- **Multi-modal Inputs**: Upload PDFs or parse YouTube transcripts to generate your knowledge graphs instantly.

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router), React 19
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Animations**: Framer Motion, Tailwind CSS v4
- **Database**: Drizzle ORM, Neon Serverless
- **Authentication**: Better Auth
- **AI Integration**: Google Generative AI (Gemini), Groq SDK
- **Speech**: React Speech Recognition
- **Document Processing**: `pdf-parse`, `youtube-transcript`
- **UI Components**: shadcn/ui, Lucide React

## 🚀 Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Set up environment variables:**
   Copy the example environment file and fill in your keys (Database, AI providers, Auth secrets).
   ```bash
   cp .env.local.example .env.local
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Database Setup

This project uses Drizzle ORM. To push the schema to your database:

```bash
npx drizzle-kit push
```

## 🌐 Deployment

Mnemo is designed to be easily deployed on [Vercel](https://vercel.com/). Connect your GitHub repository to Vercel and it will automatically build and deploy the Next.js application. Ensure all necessary environment variables are configured in the Vercel dashboard.
