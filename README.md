# Smart Expense Tracker - Backend

A Node.js backend API for the Smart Expense Tracker application.

## Features

- Express.js framework
- MongoDB with Mongoose
- JWT authentication
- Password hashing with bcrypt
- CORS enabled
- Environment variables with dotenv

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` file

3. Start the server:
```bash
npm run dev
```

## Installed Packages

### Core Dependencies
- **express** - Web framework for Node.js
- **mongoose** - MongoDB object modeling
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **bcryptjs** - Password hashing library
- **jsonwebtoken** - JWT authentication

### Development Dependencies
- **nodemon** - Auto-restart server during development

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-expenses
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## API Endpoints

- `GET /` - Welcome message

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
