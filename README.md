# Code-Visualization

A dark, cinematic code visualization platform built with Next.js. Write code, run it, and watch execution unfold step by step with highlighted lines, live variable state, and playback controls.

## Preview

| Landing page | Visualizer |
| --- | --- |
| ![Landing page](assets/image1.png) | ![Visualizer](assets/image.png) |

## Features

- Step-by-step execution playback
- Live line highlighting
- Variables and state panel
- Auto-play and manual stepping
- JavaScript and Python execution
- Snippet storage with MongoDB
- Authentication with Clerk

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Monaco Editor
- MongoDB + Mongoose
- Clerk Authentication
- Node.js VM for JavaScript execution
- Python subprocess execution

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Create a file named `.env.local` in the project root and add:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_your_publishable_key
CLERK_SECRET_KEY=sk_your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/visualizer
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/visualizer
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/code-visualizer
```

## MongoDB Setup

Use MongoDB Atlas or a local MongoDB instance.

1. Create a database named something like `code-visualizer`.
2. Copy the connection string into `MONGODB_URI`.
3. Make sure the IP access list allows your development machine.
4. The app uses Mongoose models in `lib/models/` and the connection helper in `lib/mongodb.ts`.

If your teammate is setting up the database, they only need the connection string and the same schema files already in the repo.

## Clerk Setup

1. Create a Clerk application in the Clerk dashboard.
2. Copy the publishable key and secret key into `.env.local`.
3. Set the sign-in and sign-up URLs to match the routes in the app.
4. Add Clerk middleware and protected routes if you want authenticated visualizer access only.
5. Use the same Clerk application for both team members so user sessions behave consistently.

If someone else on the team is continuing the work, they should verify these Clerk values first before debugging login issues.

## Run the App

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Project Structure

```text
app/
	api/execute/      code execution endpoints
	api/snippets/     snippet CRUD endpoints
	(dashboard)/      authenticated app routes
components/         UI and visualizer components
lib/                execution, DB, and models
assets/             screenshots for README and docs
```

## How It Works

1. Paste or write code in the editor.
2. Press Run.
3. The backend executes the code and returns an execution trace.
4. The visualizer highlights the current line and updates state.
5. Use step controls or auto-play to review execution like an animation.

## API Routes

- `POST /api/execute/javascript` - execute JavaScript and return a trace
- `POST /api/execute/python` - execute Python and return output/error info
- `GET /api/snippets` - list saved snippets
- `POST /api/snippets` - save a snippet
- `GET /api/snippets/[id]` - load one snippet
- `DELETE /api/snippets/[id]` - remove one snippet

## For Team Members

If a second member is joining the project, this is the order to follow:

1. Pull the repository.
2. Install dependencies with `npm install`.
3. Add `.env.local` with Clerk and MongoDB values.
4. Confirm MongoDB is reachable.
5. Confirm Clerk sign-in/sign-up routes are working.
6. Run `npm run dev` and open the visualizer.

## Notes

- The screenshots in `assets/` are used in this README.
- The app is designed for a dark, centered visualization layout.
- JavaScript execution uses a Node runtime, so the API route must stay on `runtime = "nodejs"`.

## Build

```bash
npm run build
npm run start
```
