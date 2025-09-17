# CSV Data Management Web Application

A full-stack Node.js + React application for uploading, editing, validating, and exporting CSV files with data integrity checks.

## 🌟 Features

- **File Upload**: Support for multiple CSV files with drag-and-drop interface
- **Data Editing**: Interactive table editing with real-time validation
- **Data Validation**: Cross-reference validation between strings and classifications data
- **Export Functionality**: Download updated CSV files
- **Responsive Design**: Mobile-friendly interface
- **Docker Support**: Easy deployment with containerization
- **Comprehensive Testing**: Unit tests for both frontend and backend

## 🏗️ Architecture

- **Frontend**: React with hooks, responsive design, and modern UI components
- **Backend**: Node.js with Express, RESTful API design
- **Data Processing**: CSV parsing, validation, and export functionality
- **Docker**: Multi-stage builds and production-ready containers

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Modern web browser

## 🚀 Local Development Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd csv-management-app
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Start development servers

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:3000
```

### 4. Access the application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## 🐳 Docker Deployment

### Build and run with Docker Compose

```bash
# Build and start the application
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# Stop the application
docker-compose down
```

### Build and run with Docker (single container)

```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run

# Or manually:
docker build -t csv-management-app .
docker run -p 3000:5000 csv-management-app
```

### Access the application

- Application: http://localhost:3000

## 🧪 Testing

### Run all tests

```bash
npm test
```

### Run backend tests only

```bash
npm run test:backend
```

### Run frontend tests only

```bash
npm run test:frontend
```

### Test Coverage

```bash
cd backend && npm test -- --coverage
cd frontend && npm test -- --coverage --watchAll=false
```

## 📖 User Guide

### 1. Upload CSV Files

- Click the upload area or drag and drop your CSV files
- Upload both `strings.csv` and `classifications.csv` files
- Files must have the correct headers and be under 10MB each

### 2. Edit Data

- Switch between tabs to view different datasets
- Click on any cell to edit data
- Add new rows using the "Add Row" button
- Delete rows using the trash icon
- Save changes before validation

### 3. Validate Data

- Click "Validate Data" to check data integrity
- Review any validation errors or warnings
- Invalid combinations will be highlighted
- Use suggestions to correct errors

### 4. Export Files

- After successful validation, use export buttons
- Download updated CSV files to your computer
- Files maintain the original structure and formatting

## 📁 Expected CSV Formats

### strings.csv

```
Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,General,Compliance,Audit Findings,Co-Au-,0,Sample prompt,,
```

### classifications.csv

```
Topic,SubTopic,Industry,Classification
Compliance,Audit Findings,General,Standard
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS (production)
- `REACT_APP_API_URL`: API base URL for frontend

### Production Configuration

Create `.env` file in root directory:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
```

## 🚀 Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy with automatic builds

### Other Platforms

- **Heroku**: Use the included `Dockerfile`
- **AWS/GCP/Azure**: Deploy using Docker containers
- **VPS**: Use Docker Compose for easy deployment

## 🏭 Production Considerations

### Security

- Rate limiting implemented
- Input sanitization and validation
- CORS configuration
- Security headers with Helmet.js

### Performance

- Gzip compression
- Static file caching
- Optimized Docker images
- Health checks

### Monitoring

- Health check endpoints
- Request logging
- Error handling and reporting

## 🛠️ Development

### Project Structure

```
csv-management-app/
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Custom middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   └── tests/             # Backend tests
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── tests/             # Frontend tests
└── docker-compose.yml     # Container orchestration
```

### API Endpoints

- `POST /api/csv/upload` - Upload CSV files
- `PUT /api/csv/update` - Update CSV data
- `POST /api/csv/validate` - Validate data integrity
- `GET /api/csv/export/:sessionId/:fileType` - Export CSV
- `GET /api/csv/data/:sessionId/:fileType` - Get CSV data
- `DELETE /api/csv/session/:sessionId` - Delete session

### Available Scripts

#### Root Level

- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build frontend for production
- `npm test` - Run all tests
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container

#### Backend

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run backend tests with Jest

#### Frontend

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run frontend tests

## 🐛 Troubleshooting

### Common Issues

1. **Upload fails**: Check file format and size limits
2. **Validation errors**: Ensure data integrity between files
3. **Docker build fails**: Check Docker version and available memory
4. **Port conflicts**: Change PORT environment variable

### Debug Mode

Set `NODE_ENV=development` to enable:

- Detailed error messages
- Request logging
- CORS relaxed for localhost
