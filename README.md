Personal Dictionary

A full‑stack web application for managing your personal vocabulary with automatic word definitions from the Free Dictionary API.

Features
- Add words with automatic definition lookup.
- Edit word meanings inline.
- Delete words with confirmation.
- Clean and intuitive interface.
- Mobile‑responsive design.
- Persistent storage with a PostgreSQL database.
- Search word functionality.
- Learn random word feature using Gemini model.
- Save on new‑word page only when Save button is clicked.
- All words displayed in lowercase.

Tech Stack
Frontend: HTML5, CSS3, JavaScript (Vanilla), Inter font from Google Fonts, responsive design with media queries.
Backend: Node.js with Express, Prisma ORM, PostgreSQL database (SQLite for local development), Free Dictionary API integration, Gemini 2.5‑flash model for random word learning.

Prerequisites
- Node.js version 14 or higher.
- npm or yarn.
- PostgreSQL for production or SQLite for local development.

Installation
1. Clone the repository and change into the project directory.
2. Install dependencies with npm install.
3. Create a .env file in the root directory and add the following variables:
   For local development with SQLite:
   DATABASE_URL="file:./prisma/words.db"
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   For production with PostgreSQL (optional):
   DATABASE_URL="postgresql://user:password@localhost:5432/dictionary"
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
4. Set up the database by running npm run prisma-generate followed by npm run prisma-migrate.
5. Start the server with npm run dev.
6. Open the application by opening front/index.html in a browser or serving the frontend with a local server.

Usage
Adding a Word: Enter a word in the Word field, optionally provide a custom meaning, and click Add.
Searching a Word: Enter a word and click Search. Existing words open the detail page for editing; new words open the New Word page with the fetched meaning.
Learning a Random Word: Click the Learn button. The app fetches a random word and definition from Gemini and displays the New Word page. Click Save to store the word or All Words to return without saving.
Editing a Word: On the detail page, click Edit, modify the meaning, and click Save.
Deleting a Word: On the detail page, click Delete and confirm.

API Endpoints
GET /words – Retrieve all words sorted alphabetically.
GET /words/:word – Get a specific word by its name.
GET /lookup/:word – Fetch a word's meaning without saving it to the database.
GET /learn – Get a random word and definition via Gemini API.
POST /words – Add a new word. Body: { word: string, meaning?: string }. Returns 409 if word already exists.
PUT /words/:word – Update a word's meaning. Body: { meaning: string }.
DELETE /words/:word – Delete a word by its name.

Note: All words are stored in lowercase. The word field serves as the unique primary key.

Project Structure
Personal Dictionary
  back/server.js – Express server with API routes
  front/index.html – Main HTML page
  front/script.js – Frontend JavaScript
  front/style.css – Styles (mobile‑responsive)
  prisma/schema.prisma – Database schema (PostgreSQL)
  prisma/migrations – Database migrations
  .env.example – Example environment variables
  package.json – Dependencies and scripts
  DEPLOYMENT.md – Deployment guide for Render.com
  README.md – This file

Scripts
npm run dev – Start the development server.
npm run start – Start the production server.
npm run prisma-generate – Generate Prisma client.
npm run prisma-migrate – Run database migrations.

Environment Variables
The application uses the following environment variables (copy .env.example to .env and edit as needed):
DATABASE_URL – SQLite or PostgreSQL connection string.
PORT – Port on which the Express server listens.
GEMINI_API_KEY – API key for the Gemini model (required for the Learn feature).
When deploying to Render.com, the DATABASE_URL is provided automatically by the PostgreSQL service.

Contributing
Feel free to submit issues and enhancement requests.

License
MIT
