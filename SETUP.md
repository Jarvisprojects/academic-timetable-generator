# 🛠️ Setup Guide - Academic Timetable Generator

Complete step-by-step installation and admin account creation.

**⏱️ Setup time: 10-15 minutes**

---

## 📋 Prerequisites

- **Node.js** v18+ → [Download](https://nodejs.org/)
- **Python** v3.9+ → [Download](https://www.python.org/)
- **PostgreSQL** v13+ → [Download](https://www.postgresql.org/)
- **Git** → [Download](https://git-scm.com/)

### ⚙️ For GitHub Codespaces

```bash
# Install PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Start service
sudo service postgresql start

# Verify
psql --version
```

---

## 🚀 Quick Setup

### 🐧 Linux / macOS Setup (7 Steps)

#### Step 1: Install Dependencies
```bash
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator
npm install
```

#### Step 2: Create Database & User
```bash
# Create database
sudo -u postgres createdb timetable_db

# Create user
sudo -u postgres psql timetable_db << 'EOF'
CREATE USER timetable_user WITH PASSWORD 'your_secure_password';
ALTER ROLE timetable_user CREATEDB SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE timetable_db TO timetable_user;
EOF
```

#### Step 3: Initialize Database Schema
```bash
# Create tables
psql postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db < init.sql

# Verify tables were created
psql postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db -c "\dt"
```

Should show: `users | timetables | audit_log`

#### Step 4: Setup Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install ortools
deactivate
```

#### Step 5: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your database details:
```env
PORT=3000
DATABASE_URL=postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db
JWT_SECRET=generate_random_32_char_string_here
PYTHON_PATH=./venv/bin/python
NODE_ENV=development
```

Generate JWT_SECRET:
```bash
openssl rand -hex 32
```

#### Step 6: Create Admin User
```bash
node backend/create-admin.js admin your_password_here
```

**Output should show:**
```
✅ Admin user created successfully!
   Username: admin
   Email: admin@admin.local
   Is Admin: true
```

#### Step 7: Verify Setup
Check that all components are ready:
```bash
# Verify database connection
psql postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db -c "SELECT COUNT(*) FROM users;"

# Start the application
npm start
```

---

### 🪟 Windows Setup (7 Steps)

#### Step 1: Install Dependencies
```cmd
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator
npm install
```

#### Step 2: Create Database & User

First, **open PostgreSQL Command Line (psql)** as administrator:

```sql
CREATE DATABASE timetable_db;
CREATE USER timetable_user WITH PASSWORD 'your_secure_password';
ALTER ROLE timetable_user CREATEDB SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE timetable_db TO timetable_user;
```

**Tip:** If you get an authentication error, verify PostgreSQL installed with the postgres user and that you know the administrative password.

#### Step 3: Initialize Database Schema
```cmd
# Run the SQL initialization script
psql -U timetable_user -d timetable_db -f init.sql

# Verify tables were created
psql -U timetable_user -d timetable_db -c "\dt"
```

Should show: `users | timetables | audit_log`

#### Step 4: Setup Python Virtual Environment
```cmd
python -m venv venv
venv\Scripts\activate
pip install ortools
deactivate
```

#### Step 5: Configure Environment
```cmd
copy .env.example .env
```

Edit `.env` with your database details. Use **Notepad** or your editor:
```env
PORT=3000
DATABASE_URL=postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db
JWT_SECRET=generate_random_32_char_string_here
PYTHON_PATH=venv\Scripts\python.exe
NODE_ENV=development
```

**Generate JWT_SECRET using Node.js:**
```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 6: Create Admin User
```cmd
node backend/create-admin.js admin your_password_here
```

**Output should show:**
```
✅ Admin user created successfully!
   Username: admin
   Email: admin@admin.local
   Is Admin: true
```

#### Step 7: Verify Setup
Check that all components are ready:
```cmd
# Verify database connection
psql -U timetable_user -d timetable_db -c "SELECT COUNT(*) FROM users;"

# Start the application
npm start
```

---

## ▶️ Start Application

**Linux / macOS:**
```bash
npm start
```

**Windows:**
```cmd
npm start
```

Visit **http://localhost:3000** in your web browser.

**Login with your admin credentials:**
- Username: `admin` (or custom username if you created a different one)
- Password: `your_password_here` (the password you set)

---

## 🔧 Admin Account - Quick Reference

**Create admin with custom credentials:**
```bash
node backend/create-admin.js myusername mypassword
```

**Examples:**
```bash
# Default admin/admin123
node backend/create-admin.js admin admin123

# Custom user
node backend/create-admin.js teacher teacherpass123

# Another admin
node backend/create-admin.js boss secretp@ss
```

---

## ✅ Verification Checklist

- [ ] npm install completed
- [ ] Database created (timetable_db)
- [ ] Tables initialized (\dt shows 3 tables)
- [ ] .env file configured
- [ ] Python venv setup with ortools
- [ ] Admin user created
- [ ] npm start works
- [ ] Can access http://localhost:3000
- [ ] Can login with your admin credentials

---

## 🐛 Troubleshooting

### PostgreSQL not installing on Linux
```bash
# Skip to here if postgres fails:
# You need a working PostgreSQL instance running somewhere
# Update DATABASE_URL in .env with your connection string
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
```

### PostgreSQL not running on Windows
```cmd
# Ensure PostgreSQL Windows Service is running:
# 1. Press Win+R, type: services.msc
# 2. Find "PostgreSQL Server" and make sure it's running
# 3. Or restart from Command Prompt:
net start PostgreSQL-x64-13
```

### "relation 'users' does not exist"

Database tables not initialized. Run the initialization script:

**Linux/macOS:**
```bash
psql postgresql://timetable_user:password@localhost:5432/timetable_db < init.sql
```

**Windows:**
```cmd
psql -U timetable_user -d timetable_db -f init.sql
```

### "Cannot connect to database"

Test your connection string:

**Linux/macOS:**
```bash
psql postgresql://timetable_user:your_password@localhost:5432/timetable_db -c "SELECT 1"
```

**Windows:**
```cmd
psql -U timetable_user -d timetable_db -c "SELECT 1"
```

**If this fails:**
1. Verify DATABASE_URL in `.env` is correct
2. Confirm PostgreSQL service is running
3. Check that the user `timetable_user` exists with correct password
4. Verify the database `timetable_db` exists

### Admin creation fails

**Error:** "relation 'users' does not exist"

**Solution:**
```bash
# First, ensure database schema is initialized (see above)
node backend/create-admin.js admin adminpass

# If still fails, verify:
# 1. .env DATABASE_URL points to correct database
# 2. Database tables exist (run init.sql)
# 3. PostgreSQL service is running
```

### Port 3000 already in use

**Linux/macOS:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env:
# PORT=3001
```

**Windows:**
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the process ID):
taskkill /PID PID /F

# Or change port in .env:
REM PORT=3001
```

### Python import error: "No module named 'ortools'"

**Solution:**

**Linux/macOS:**
```bash
source venv/bin/activate
pip install ortools
deactivate
```

**Windows:**
```cmd
venv\Scripts\activate
pip install ortools
deactivate
```

### PYTHON_PATH error in logs

**Issue:** "Cannot find Python interpreter"

**Solution:** Update `PYTHON_PATH` in `.env`

**Linux/macOS examples:**
```env
PYTHON_PATH=./venv/bin/python
# or
PYTHON_PATH=/usr/bin/python3
```

**Windows examples:**
```env
PYTHON_PATH=venv\Scripts\python.exe
# or
PYTHON_PATH=C:\Python39\python.exe
```

### Environment variables not loading

**Issue:** Changes to `.env` don't take effect

**Solution:**
1. Stop the application (Ctrl+C)
2. Restart: `npm start`

---

## 📚 Technology Stack

- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (v13+)
- **Frontend:** EJS Templates + Vanilla JS
- **Optimizer:** Python + Google OR-Tools
- **Styling:** Tailwind CSS
- **Auth:** JWT Tokens

---

**Ready to schedule? 🎓**
