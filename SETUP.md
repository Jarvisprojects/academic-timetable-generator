# 🛠️ Setup Guide

Complete installation instructions for Academic Timetable Generator.

## 📋 Prerequisites

Before starting, ensure installed:
```bash
node --version       # v18+
python3 --version    # v3.9+  
psql --version       # v13+
git --version        # v2+
```

## 🚀 Installation (5 Steps)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator
npm install
```

### 2. Create PostgreSQL Database
```bash
# Create database
createdb timetable_db

# Create user with privileges
psql -U postgres -d timetable_db << EOF
CREATE USER timetable_user WITH PASSWORD 'your_secure_password';
ALTER DATABASE timetable_db OWNER TO timetable_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO timetable_user;
EOF
```

### 3. Setup Python Virtual Environment

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install ortools
deactivate
```

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
pip install ortools
deactivate
```

### 4. Configure Environment

Copy template and edit:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
DATABASE_URL=postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db
JWT_SECRET=<generate_random_32_char_string>
PYTHON_PATH=./venv/bin/python
NODE_ENV=development
```

Generate JWT_SECRET:
```bash
# Linux/macOS
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

### 5. Initialize & Start

```bash
# Create database tables and admin user
npm run setup:db

# Start application
npm start
```

Open **http://localhost:3000** and login!

## 🧪 Testing

1. **Login** - Use admin account created in step 5
2. **Create Timetable** - Add 2-3 teachers, subjects, rooms
3. **Set Time Slots** - 8AM-5PM, 1 hour each
4. **Generate** - Click "Generate Schedule"
5. **View Results** - Check grid and JSON output

## 📁 Project Structure

```
backend/         - Express API + EJS templates
frontend/        - JavaScript utilities
scheduler/       - Python optimizer (OR-Tools)
examples/        - Sample data files
```

## 🔧 Available Commands

```bash
npm start         # Start application  
npm run setup:db  # Initialize database
npm run setup:admin # Create admin account
```

## 🐛 Troubleshooting

### Python Not Found
Update `PYTHON_PATH` in `.env`:
```env
PYTHON_PATH=/usr/bin/python3
```

### PostgreSQL Connection Fails
Check database is running and credentials match `.env`:
```bash
psql postgresql://timetable_user:your_password@localhost:5432/timetable_db
```

### Port 3000 Already In Use
Change port in `.env`:
```env
PORT=3001
```

Or kill process:
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module Not Found Error
Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

### Database Tables Don't Exist
Run initialization:
```bash
npm run setup:db
```

## 📊 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@localhost:5432/db |
| JWT_SECRET | Login token secret | random_32_char_minimum |
| PYTHON_PATH | Python executable | ./venv/bin/python |
| NODE_ENV | Environment mode | development/production |

## ✅ Production Checklist

Before deploying:
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET (50+ chars)
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL
- [ ] Setup database backups
- [ ] Configure error monitoring
- [ ] Setup firewall rules

## 🆘 Still Having Issues?

1. Verify all prerequisites installed
2. Check all `.env` values correct
3. Ensure PostgreSQL running
4. Try reinstalling: `npm install`
5. Check terminal error messages
6. Review error logs carefully

For more help see [README.md](README.md)
# 📋 Setup Guide - Academic Timetable Generator

Complete installation instructions for the Academic Timetable Generator.

**⏱️ Time required: 10-15 minutes**

---

## ⚡ Quick Start (Recommended)

Choose your operating system:

### Linux/macOS
```bash
# Run the automated setup script
bash setup.sh

# Start the application
npm start

# Open http://localhost:3000
```

### Windows
```cmd
# Run the automated setup script
setup.bat

# Start the application
npm start

# Open http://localhost:3000
```

The setup scripts automatically:
- ✅ Check prerequisites (Node.js, Python, PostgreSQL)
- ✅ Install Node.js dependencies
- ✅ Create Python virtual environment with Google OR-Tools
- ✅ Set up PostgreSQL database
- ✅ Create environment configuration (`.env`)
- ✅ Initialize database tables
- ✅ Create admin user account

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js** 18+ → [Download](https://nodejs.org/)
- **Python** 3.9+ → [Download](https://www.python.org/)
- **PostgreSQL** 13+ → [Download](https://www.postgresql.org/)
- **Git** → [Download](https://git-scm.com/)
- **npm** (comes with Node.js)

### Verify Installation

```bash
node --version      # Should be v18.0.0 or higher
npm --version       # Should be 8.0.0 or higher
python3 --version   # Should be 3.9.0 or higher
psql --version      # Should be 13.0 or higher
git --version       # Should be 2.0.0 or higher
```

---

## 🛠️ Manual Setup (If Automated Setup Fails)

Follow these steps if the automated setup script encounters issues.

### Step 1: Clone Repository

```bash
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator
```

### Step 2: Install Node Dependencies

```bash
npm install
```

This installs:
- Express.js 5.2.1 (Web framework)
- PostgreSQL driver
- JWT authentication
- Express validator
- Rate limiting middleware
- Security headers (Helmet)
- EJS templating
- Tailwind CSS
- bcrypt password hashing

### Step 3: Set Up Python Virtual Environment

#### macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install ortools
deactivate
```

#### Windows:
```bash
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip setuptools wheel
pip install ortools
deactivate
```

### Step 4: Create PostgreSQL Database

Open PostgreSQL shell and run:

```sql
CREATE DATABASE timetable_db;
CREATE USER timetable_user WITH PASSWORD 'your_secure_password';
ALTER DATABASE timetable_db OWNER TO timetable_user;
\c timetable_db
GRANT ALL ON SCHEMA public TO timetable_user;
ALTER SCHEMA public OWNER TO timetable_user;
```

Or use the command line:

```bash
createdb -U postgres timetable_db
psql -U postgres -d timetable_db -c "CREATE USER timetable_user WITH PASSWORD 'your_secure_password'; GRANT ALL ON SCHEMA public TO timetable_user; GRANT ALL PRIVILEGES ON SCHEMA public TO timetable_user;"
```

### Step 5: Create Environment File

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with these values:

```env
PORT=3000
DATABASE_URL=postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db
JWT_SECRET=<your-secret-key-change-this>
PYTHON_PATH=./venv/bin/python
NODE_ENV=development
```

**Generate a secure JWT_SECRET:**

**macOS/Linux:**
```bash
openssl rand -hex 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

### Step 6: Initialize Database

```bash
npm run setup:db
```

This will:
- Create database tables
- Prompt you to create an admin account

### Step 7: Start the Application

```bash
npm start
```

Visit **http://localhost:3000** in your browser.

---

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
# or
npm start
```

### Available npm Scripts
```bash
npm install        # Install dependencies
npm start          # Start development server
npm run dev        # Development with auto-reload
npm run setup      # Run setup wizard
npm run setup:db   # Initialize database only
```

---

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens | Random hex string (min 32 chars) |
| `PYTHON_PATH` | Path to Python executable | `./venv/bin/python` (Linux/macOS) or `venv\Scripts\python.exe` (Windows) |
| `NODE_ENV` | Environment mode | `development` or `production` |

---

## 📂 Project Structure

```
academic-timetable-generator/
├── backend/              # Node.js Express API
│   ├── server.js        # Main server entry
│   ├── config.js        # Configuration
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── scripts/         # Setup scripts
│   └── views/           # EJS templates
├── frontend/            # Client-side code
│   └── js/             # JavaScript utilities
├── scheduler/           # Python constraint solver
│   └── ...py           # Python modules
├── examples/            # Sample data files
├── setup.sh            # Linux/macOS automated setup
├── setup.bat           # Windows automated setup
├── package.json        # Node.js dependencies
├── .env.example        # Environment template
└── README.md           # Project overview
```

---

## 🔐 Security Recommendations

1. **Change the JWT_SECRET**: Generate a strong random secret. Do NOT use the default in production.
2. **Strong Database Password**: Use a complex password for `timetable_user`.
3. **Use HTTPS**: Set `HTTPS` environment variable when deploying to production.
4. **Audit Logs**: All admin actions are logged. Review logs regularly.

---

## 🧪 Testing

Sample data for testing:

- **Timetable Input**: See [examples/sample-timetable-input.json](examples/sample-timetable-input.json)
- **API Request**: See [examples/sample-api-request.json](examples/sample-api-request.json)

---

## ❓ Troubleshooting

### "Command not found: python3" (macOS/Linux)
Solution: Install Python or check your PATH. Try `python` instead of `python3`.

### "PostgreSQL connection refused"
Solution: Ensure PostgreSQL is running. Check connection string in `.env`.

### "Port 3000 already in use"
Solution: Change PORT in `.env` or kill the process using port 3000.

### "venv: command not found"
Solution: Install Python virtual environment:
```bash
# Linux/macOS
sudo apt-get install python3-venv  # Ubuntu/Debian
brew install python@3.11           # macOS

# Windows - Python includes venv
```

### Database creation fails
Solution: Ensure PostgreSQL user `postgres` has sufficient privileges:
```bash
psql -U postgres -c "ALTER USER postgres WITH SUPERUSER;"
```

---

## 📞 Additional Resources

- **README**: See [README.md](README.md)

---

## ✅ Verify Installation

After setup, verify everything works:

1. Backend server starts: `npm start` (should show "Server running on http://localhost:3000")
2. Database connected: Check in browser console for "Connected to database"
3. Admin login works: Use credentials created during setup
4. Scheduler: Create a test timetable to verify Python integration

---

**Need help?** Check the [README.md](README.md) for more information.
5. **Python:** Verify with `python3 --version`

---

## 📖 Additional Resources

- [Express.js Docs](https://expressjs.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [OR-Tools Documentation](https://developers.google.com/optimization)
- [EJS Templating](https://ejs.co)

---

**Need help?** Check the README.md or contact the development team.
