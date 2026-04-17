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

## 🚀 Quick Setup (6 Steps)

### Step 1: Install Dependencies
```bash
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator
npm install
```

### Step 2: Create Database & User
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

Should show: `users | timetables | audit_log`

### Step 4: Python Setup
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# or: venv\Scripts\activate  (Windows)

pip install ortools
deactivate
```

### Step 5: Configure Environment
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
openssl rand -hex 32     # Linux/macOS
```

### Step 6: Create Admin User
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

---

## ▶️ Start Application

```bash
npm start
```

Visit **http://localhost:3000**

**Login with:**
- Username: `admin`
- Password: `your_password_here`

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

### PostgreSQL not installing
```bash
# Skip to here if postgres fails:
# You need a working PostgreSQL instance running somewhere
# Update DATABASE_URL in .env with your connection string
```

### "relation 'users' does not exist"
```bash
# Re-run schema initialization
psql postgresql://timetable_user:password@localhost:5432/timetable_db < init.sql
```

### "Cannot connect to database"
```bash
# Test connection
psql postgresql://timetable_user:your_password@localhost:5432/timetable_db -c "SELECT 1"
```

### Admin creation fails
```bash
# Verify tables exist first
node backend/create-admin.js admin adminpass
# If error, check:
# 1. .env DATABASE_URL is correct
# 2. Database tables exist (psql ... < init.sql)
# 3. PostgreSQL service is running
```

### Port 3000 in use
```bash
# Change PORT in .env or kill process:
lsof -ti:3000 | xargs kill -9  # Linux/macOS
netstat -ano | findstr :3000   # Windows
```

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

### Step 3: Initialize Database Schema
```bash
# Create tables
psql postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db < init.sql

# Verify tables
psql postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db << 'EOF'
\dt
