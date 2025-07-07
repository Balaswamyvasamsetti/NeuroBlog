# NeuroBlog - AI-Powered Blogging Platform

A modern, full-stack blogging platform with AI integration, real-time collaboration, and advanced features.

## Features

### Core Features
- **User Authentication**: Secure registration/login with JWT tokens
- **Blog Management**: Create, edit, delete, and publish blog posts
- **AI Integration**: Gemini AI for content suggestions, title generation, and content improvement
- **Real-time Collaboration**: WebSocket-based live editing
- **Push Notifications**: Web push notifications for new posts
- **Search & Filtering**: Full-text search with advanced filtering
- **Categories & Tags**: Organize content with hierarchical categories
- **Comments System**: Nested comments with upvoting
- **Voice Navigation**: Speech recognition for hands-free navigation
- **Responsive Design**: Mobile-first responsive UI

### Advanced Features
- **Content Scheduling**: Schedule posts for future publication
- **Post Reactions**: Emoji reactions on posts
- **Admin Dashboard**: Analytics and content management
- **SEO Optimization**: Meta tags and search-friendly URLs
- **Rate Limiting**: API protection against abuse
- **Error Handling**: Comprehensive error handling and logging
- **Docker Support**: Containerized deployment

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **WebSocket** for real-time features
- **Web Push** for notifications
- **Winston** for logging
- **Helmet** for security
- **Rate Limiting** for API protection

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Quill** for rich text editing
- **Chart.js** for analytics

### AI Integration
- **Google Gemini AI** for content assistance

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Environment Variables

Create `.env` files in both server and root directories:

**Server (.env)**:
```env
PORT=8080
WS_PORT=8081
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Root (.env)**:
```env
# Same as server .env for Docker compose
```

### Local Development

1. **Clone the repository**:
```bash
git clone <repository-url>
cd NeuroBlog
```

2. **Install server dependencies**:
```bash
cd server
npm install
```

3. **Install client dependencies**:
```bash
cd ../client
npm install
```

4. **Start the development servers**:

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm start
```

5. **Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- WebSocket: ws://localhost:8081

### Docker Deployment

1. **Build and run with Docker Compose**:
```bash
docker-compose up --build
```

2. **Access the application**:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/subscribe` - Subscribe to push notifications
- `GET /api/auth/vapid-public-key` - Get VAPID public key

### Posts
- `GET /api/posts` - Get all posts (with pagination)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/react` - Add/remove reaction
- `GET /api/posts/search/:query` - Search posts

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/upvote` - Upvote comment

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### AI Features
- `POST /api/gemini/suggest-title` - Generate title suggestions
- `POST /api/gemini/generate-summary` - Generate post summary
- `POST /api/gemini/suggest-tags` - Suggest tags
- `POST /api/gemini/improve-content` - Improve content
- `POST /api/gemini/content-ideas` - Generate content ideas

## Project Structure

```
NeuroBlog/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── middleware/         # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── server.js          # Main server file
│   └── package.json
├── docker-compose.yml     # Docker configuration
├── Dockerfile            # Docker image definition
└── README.md
```

## Key Features Explained

### AI Integration
The platform integrates with Google's Gemini AI to provide:
- Automatic title suggestions based on content
- Content summarization
- Tag suggestions
- Grammar and style improvements
- Content idea generation

### Real-time Collaboration
Uses WebSocket connections to enable:
- Live editing sessions
- Real-time notifications
- Collaborative document editing

### Push Notifications
Implements Web Push API for:
- New post notifications
- Comment notifications
- System announcements

### Voice Navigation
Speech recognition enables:
- Hands-free navigation
- Voice commands for common actions
- Accessibility improvements

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- Environment variable protection

## Performance Optimizations

- Database indexing for search
- Pagination for large datasets
- Image optimization
- Lazy loading
- Caching strategies
- Minified production builds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.