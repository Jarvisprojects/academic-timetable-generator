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

## 🚀 Setup (5 minutes)

```bash
# 1. Clone
git clone https://github.com/yashrajghongane/academic-timetable-generator.git
cd academic-timetable-generator

# 2. Install dependencies
npm install

# 3. Setup Database
createdb timetable_db
psql -U postgres -d timetable_db -c "
CREATE USER timetable_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE timetable_db TO timetable_user;
"

# 4. Configure
cp .env.example .env
# Edit .env with your database credentials

# 5. Python Environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  (Windows)
pip install ortools
deactivate

# 6. Initialize & Start
npm run setup:db
npm start
```

Open **http://localhost:3000** and login!

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
npm start         # Start app
npm run setup:db  # Setup database
npm run setup:admin # Create admin
```

## 📋 .env Configuration
```env
PORT=3000
DATABASE_URL=postgresql://timetable_user:password@localhost:5432/timetable_db
JWT_SECRET=generate_random_32_char_string
PYTHON_PATH=./venv/bin/python
NODE_ENV=development
```

Generate JWT_SECRET:
```bash
openssl rand -hex 32  # Linux/macOS
```

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
