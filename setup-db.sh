#!/bin/bash

# Database Setup Script
# Initializes PostgreSQL for the Academic Timetable Generator

set -e

echo "🛠️  Academic Timetable Generator - Database Setup"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "📋 Checking PostgreSQL status..."
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo -e "${YELLOW}⏳ PostgreSQL not running, starting...${NC}"
    sudo service postgresql start
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}\n"

# Create .pgpass file for authentication
echo "🔐 Setting up authentication credentials..."
PGPASS="$HOME/.pgpass"
if [ ! -f "$PGPASS" ]; then
    cat > "$PGPASS" << EOF
localhost:5432:postgres:postgres:postgres
localhost:5432:timetable_db:timetable_user:timetable_password
EOF
    chmod 600 "$PGPASS"
    echo -e "${GREEN}✅ Created .pgpass file${NC}\n"
else
    echo -e "${YELLOW}ℹ️  .pgpass already exists${NC}\n"
fi

# Modify pg_hba.conf to allow local connections (requires sudo)
echo "🔧 Configuring PostgreSQL authentication..."
PG_HBA="/etc/postgresql/16/main/pg_hba.conf"

# Add host-based connection for local TCP access if not already present
if ! grep -q "host.*localhost.*127.0.0.1.*md5" "$PG_HBA" 2>/dev/null; then
    echo "Adding host-based authentication rule..."
    sudo bash -c "echo 'host    all    timetable_user    127.0.0.1/32    md5' >> $PG_HBA"
    sudo bash -c "echo 'host    all    postgres    127.0.0.1/32    md5' >> $PG_HBA"
    echo -e "${GREEN}✅ Updated pg_hba.conf${NC}\n"
else
    echo -e "${YELLOW}ℹ️  Authentication rules already configured${NC}\n"
fi

# Restart PostgreSQL to apply changes
echo "🔄 Restarting PostgreSQL..."
sudo service postgresql restart > /dev/null 2>&1
sleep 2
echo -e "${GREEN}✅ PostgreSQL restarted${NC}\n"

# Now try to set up database and user
echo "🗄️  Creating database and user..."

# Set PostgreSQL password for postgres user (if needed)
export PGPASSWORD="postgres"

# Create user
echo -n "  Creating user 'timetable_user'... "
if psql -h localhost -U postgres -d postgres -c "CREATE USER timetable_user WITH PASSWORD 'timetable_password';" 2>/dev/null; then
    echo -e "${GREEN}✅${NC}"
elif psql -h localhost -U postgres -d postgres -c "ALTER USER timetable_user WITH PASSWORD 'timetable_password';" 2>/dev/null; then
    echo -e "${YELLOW}(User already existed, password updated)${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Create database
echo -n "  Creating database 'timetable_db'... "
if psql -h localhost -U postgres -d postgres -c "CREATE DATABASE timetable_db OWNER timetable_user;" 2>/dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}(Database already exists)${NC}"
fi
echo ""

# Unset password for remaining operations
unset PGPASSWORD
export PGPASSWORD="timetable_password"

# Initialize schema
echo "📋 Initializing database schema..."
if [ -f "init.sql" ]; then
    psql -h localhost -U timetable_user -d timetable_db -f init.sql > /dev/null 2>&1
    echo -e "${GREEN}✅ Database schema initialized${NC}\n"
else
    echo -e "${RED}❌ init.sql not found${NC}\n"
    exit 1
fi

# Verify setup
echo "✔️  Verifying setup..."
TABLES=$(psql -h localhost -U timetable_user -d timetable_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null)
echo "  Tables created: $TABLES"
echo ""

echo "🎉 Database setup complete!"
echo ""
echo "📝 Connection details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: timetable_db"
echo "   User: timetable_user"
echo "   Password: timetable_password"
echo ""
