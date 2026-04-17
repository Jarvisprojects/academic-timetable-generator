
# 📅 Academic Timetable Generator

Automatically generate **conflict-free schedules** using Python optimization.

## ✨ Features
- Automatic scheduling with no conflicts
- User management & admin panel
- Real-time generation progress
- JSON import/export
- Audit logging
- Responsive UI

## 🛠️ Tech Stack
| Part | Tech |
|------|------|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Optimizer | Python + OR-Tools |
| Frontend | EJS + Tailwind |

## ⚙️ Prerequisites
- Node.js v18+ https://nodejs.org/
- Python v3.9+ https://www.python.org/
- PostgreSQL v13+ https://www.postgresql.org/
- Git https://git-scm.com/

## 🚀 Setup

### 🐧 Linux / macOS Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator
npm install

# 2. Create database and user
sudo -u postgres createdb timetable_db
sudo -u postgres psql timetable_db << 'EOF'
CREATE USER timetable_user WITH PASSWORD 'your_secure_password';
ALTER ROLE timetable_user CREATEDB SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE timetable_db TO timetable_user;
EOF

# 3. Initialize database schema
psql postgresql://timetable_user:your_secure_password@localhost:5432/timetable_db < init.sql

# 4. Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install ortools
deactivate

# 5. Configure environment
cp .env.example .env
# Edit .env with your database credentials (see .env Configuration below)

# 6. Create admin account
node backend/create-admin.js admin your_password_here

# 7. Start application
npm start
```

### 🪟 Windows Setup

```cmd
# 1. Clone and install dependencies
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator
npm install

# 2. Create database and user (using PostgreSQL's psql)
# First, open psql as administrator and run:
CREATE DATABASE timetable_db;
CREATE USER timetable_user WITH PASSWORD 'your_secure_password';
ALTER ROLE timetable_user CREATEDB SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE timetable_db TO timetable_user;

# 3. Initialize database schema
psql -U timetable_user -d timetable_db -f init.sql

# 4. Setup Python virtual environment
python -m venv venv
venv\Scripts\activate
pip install ortools
deactivate

# 5. Configure environment
copy .env.example .env
REM Edit .env with your database credentials (see .env Configuration below)

# 6. Create admin account
node backend/create-admin.js admin your_password_here

# 7. Start application
npm start
```

Open **http://localhost:3000** and login with your admin credentials!

## 🧪 Test It
1. Login with admin account
2. Create timetable (add teachers, subjects, rooms)
3. Generate schedule - wait for completion
4. View results in grid or JSON format

See `examples/` for sample data format.

## 📁 Structure
```
backend/     - Express API & templates
frontend/    - JavaScript code
scheduler/   - Python optimizer
examples/    - Sample data
```

## 🔧 Commands

```bash
# Start the application
npm start

# Create an admin account
node backend/create-admin.js username password

# Examples:
node backend/create-admin.js admin admin123
node backend/create-admin.js teacher teacherpass123
```

## 📋 .env Configuration

```env
PORT=3000
DATABASE_URL=postgresql://timetable_user:password@localhost:5432/timetable_db
JWT_SECRET=generate_random_32_char_string
PYTHON_PATH=./venv/bin/python
NODE_ENV=development
```

**Generate JWT_SECRET:**

**Linux/macOS:**
```bash
openssl rand -hex 32
```

**Windows (using Node.js):**
```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**PYTHON_PATH examples:**
- **Linux/macOS:** `./venv/bin/python` or `/usr/bin/python3`
- **Windows:** `venv\Scripts\python.exe` or `C:\Python39\python.exe`

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Python not found | Update PYTHON_PATH in .env |
| DB connection fails | Start PostgreSQL, verify credentials |
| Port 3000 in use | Change PORT in .env to 3001 |
| Setup fails | See SETUP.md troubleshooting |

## 📖 More Help
See [SETUP.md](SETUP.md) for detailed troubleshooting.

## 📄 License
ISC License
