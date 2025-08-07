# PKSyllabus - Karate Belt Grading Requirements

A Node.js/Express web application for managing and viewing karate belt grading requirements.

## Features

- **Public Viewing**: Browse karate syllabus requirements by belt level
- **Admin Interface**: Edit and manage syllabus content (authentication required)
- **Data Validation**: Comprehensive validation of syllabus structure before saving
- **Automatic Backups**: Creates timestamped backups before any syllabus updates
- **Security Logging**: Detailed logging of authentication attempts and data changes
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:3000`

## Authentication

Admin functions are protected with HTTP Basic Authentication.

### Default Credentials
- **Username**: `admin`
- **Password**: `karate123`

### Environment Variables
You can customize the admin credentials using environment variables:
```bash
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
```

### Protected Routes
- `POST /api/syllabus` - Update syllabus data
- `/admin.html` - Admin interface
- `/editSyllabus.html` - Syllabus editor

## Logging

The application uses Winston for comprehensive logging:

- **Console Logging**: Real-time logs displayed in the terminal
- **File Logging**: 
  - `logs/combined.log` - All application logs
  - `logs/error.log` - Error logs only
- **Structured Logging**: JSON format with timestamps and metadata

### Log Events
- Authentication attempts (success/failure)
- Syllabus data requests and updates
- Data validation results
- Backup creation
- Server startup and configuration

## Data Validation

Syllabus data is validated using Joi schema validation:

- **Structure Validation**: Ensures proper belt and category organization
- **Content Validation**: Validates individual items and requirements
- **Error Reporting**: Detailed validation error messages
- **Flexible Schema**: Allows for new categories and belt types

## Backup System

Automatic backups are created before any syllabus updates:

- **Location**: `backups/` directory
- **Format**: `syllabus-backup-YYYY-MM-DDTHH-MM-SS-sssZ.json`
- **Automatic**: Created before every successful update
- **Logging**: Backup creation is logged with file paths

## File Structure

```
├── server.js              # Main Express server
├── package.json           # Node.js dependencies
├── syllabus.json          # Syllabus data storage
├── admin.html             # Admin interface
├── public/
│   ├── index.html         # Main viewing interface
│   ├── editSyllabus.html  # Syllabus editor
│   └── pkr_logo.webp      # Logo image
├── logs/                  # Application logs
│   ├── combined.log       # All logs
│   └── error.log          # Error logs only
├── backups/               # Automatic syllabus backups
└── README.md              # This file
```

## API Endpoints

- `GET /api/syllabus` - Retrieve syllabus data (public)
- `POST /api/syllabus` - Update syllabus data (requires authentication)

## Security Notes

- Change default admin credentials before deploying to production
- Consider using HTTPS in production environments
- The current implementation uses file-based storage - consider a database for production use

## Development

The application uses:
- **Backend**: Node.js with Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Authentication**: HTTP Basic Auth
- **Data Storage**: JSON file

## License

This project is for educational and training purposes.
