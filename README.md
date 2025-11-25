# Personal Dictionary

A full-stack web application for managing your personal vocabulary with automatic word definitions from the Free Dictionary API.

## Features

- ✨ Add words with automatic definition lookup
- 📝 Edit word meanings inline
- 🗑️ Delete words with confirmation
- 🔍 Clean and intuitive interface
- 📱 Mobile-responsive design
- 💾 Persistent storage with PostgreSQL database

## Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Inter font from Google Fonts
- Responsive design with media queries

**Backend:**
- Node.js with Express
- Prisma ORM
- PostgreSQL database (SQLite for local development)
- Free Dictionary API integration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (for production) or SQLite (for local development)

## Installation

1. **Clone the repository**
   ```bash
   cd Personal\ Dictionary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # For local development with SQLite
   DATABASE_URL="file:./prisma/words.db"
   PORT=3000
   
   # For production with PostgreSQL
   # DATABASE_URL="postgresql://user:password@localhost:5432/dictionary"
   ```

4. **Set up the database**
   ```bash
   npm run prisma-generate
   npm run prisma-migrate
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   - Open `front/index.html` in your browser, or
   - Serve the frontend using a local server (e.g., Live Server extension in VS Code)

## Usage

### Adding a Word
1. Enter a word in the "Word" field
2. Optionally enter a custom meaning, or leave blank to auto-fetch from the dictionary API
3. Click "Add"

### Editing a Word
1. Click the "Edit" button next to any word
2. Modify the meaning in the input field
3. Click "Submit" or press Enter to save

### Deleting a Word
1. Click the "Delete" button next to any word
2. Confirm the deletion in the dialog

## API Endpoints

### `GET /words`
Retrieve all words in the dictionary (ordered by most recent first)

### `POST /words`
Add a new word
- **Body**: `{ word: string, meaning?: string }`
- If meaning is not provided, it will be fetched from the Free Dictionary API

### `PUT /words/:id`
Update a word's meaning
- **Body**: `{ word: string, meaning: string }`

### `DELETE /words/:id`
Delete a word by ID

## Project Structure

```
Personal Dictionary/
├── back/
│   └── server.js          # Express server with API routes
├── front/
│   ├── index.html         # Main HTML page
│   ├── script.js          # Frontend JavaScript
│   └── style.css          # Styles (mobile-responsive)
├── prisma/
│   ├── schema.prisma      # Database schema (PostgreSQL)
│   └── migrations/        # Database migrations
├── .env.example           # Example environment variables
├── package.json           # Dependencies and scripts
├── DEPLOYMENT.md          # Deployment guide for Render.com
└── README.md              # This file
```

## Scripts

- `npm run dev` - Start the development server
- `npm run start` - Start the production server
- `npm run prisma-generate` - Generate Prisma client
- `npm run prisma-migrate` - Run database migrations

## Environment Variables

The app uses environment variables for configuration. Copy `.env.example` to `.env` and update:

**For Local Development (SQLite):**
```env
DATABASE_URL="file:./prisma/words.db"
PORT=3000
```

**For Production (PostgreSQL):**
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
PORT=3000
```

> **Note:** When deploying to Render.com, the `DATABASE_URL` will be automatically provided by the PostgreSQL database service.

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
