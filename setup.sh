#!/bin/bash

# ============================================================================
# Academic Timetable Generator - Complete Setup Script
# ============================================================================
# This script automates the entire installation process for the project
# Usage: bash setup.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is not installed or not in PATH"
        return 1
    fi
    print_success "$1 is installed"
    return 0
}

# ============================================================================
# 1. PREREQUISITES CHECK
# ============================================================================

print_header "Step 1: Checking Prerequisites"

print_info "Checking required commands..."
MISSING_DEPS=0

if ! check_command "node"; then
    MISSING_DEPS=1
fi

if ! check_command "npm"; then
    MISSING_DEPS=1
fi

if ! check_command "python3"; then
    MISSING_DEPS=1
fi

if ! check_command "git"; then
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Some dependencies are missing. Please install them first:"
    echo "  - Node.js (https://nodejs.org/)"
    echo "  - Python 3 (https://www.python.org/)"
    echo "  - Git (https://git-scm.com/)"
    echo "  - Docker (for PostgreSQL) (https://www.docker.com/)"
    exit 1
fi

print_success "All prerequisites are installed"

# ============================================================================
# 2. NODE.JS SETUP
# ============================================================================

print_header "Step 2: Installing Node.js Dependencies"

if [ -f "package.json" ]; then
    print_info "Running: npm install"
    npm install
    print_success "Node.js dependencies installed"
else
    print_error "package.json not found"
    exit 1
fi

# ============================================================================
# 3. PYTHON SETUP
# ============================================================================

print_header "Step 3: Setting Up Python Environment"

if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_warning "Virtual environment already exists"
fi

print_info "Activating virtual environment and installing dependencies..."
source venv/bin/activate

print_info "Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel

print_info "Installing Python packages..."
pip install ortools

print_success "Python environment configured"

# ============================================================================
# 4. ENVIRONMENT CONFIGURATION
# ============================================================================

print_header "Step 4: Configuring Environment Variables"

if [ ! -f ".env" ]; then
    print_warning ".env file not found, creating from defaults..."
    cat > .env << 'EOF'
# ========== SERVER CONFIGURATION ==========
PORT=3000

# ========== DATABASE CONFIGURATION ==========
DATABASE_URL=postgresql://timetable_user:timetable123@localhost:5432/timetable_db

# ========== SECURITY ==========
JWT_SECRET=c8e7d3a9f2b4e1c6d9a3f5e8b2c7d1a4f6e9b2c5d8e1a4f7b0c3d6e9a2f5

# ========== PYTHON & SCHEDULER ==========
PYTHON_PATH=./venv/bin/python

# ========== ENVIRONMENT ==========
NODE_ENV=development
EOF
    print_success ".env file created"
else
    print_warning ".env file already exists"
    print_info "Review .env file and update DATABASE_URL if needed"
fi

# ============================================================================
# 5. DATABASE SETUP
# ============================================================================

print_header "Step 5: Setting Up PostgreSQL Database"

if ! command -v "docker" &> /dev/null; then
    print_warning "Docker not found. Please ensure PostgreSQL is running."
    print_info "PostgreSQL connection: postgresql://timetable_user:timetable123@localhost:5432/timetable_db"
else
    print_info "Checking if PostgreSQL container is running..."
    if docker ps | grep -q "timetable-postgres"; then
        print_warning "PostgreSQL container already running"
    else
        print_info "Starting PostgreSQL in Docker..."
        docker run -d \
            --name timetable-postgres \
            -e POSTGRES_USER=timetable_user \
            -e POSTGRES_PASSWORD=timetable123 \
            -e POSTGRES_DB=timetable_db \
            -p 5432:5432 \
            postgres:16-alpine
        
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 5
        print_success "PostgreSQL container started"
    fi
fi

# ============================================================================
# 6. DATABASE INITIALIZATION
# ============================================================================

print_header "Step 6: Initializing Database Schema"

print_info "Running database setup script..."
node backend/scripts/setup.js << EOF
admin
admin@timetable.local
Admin@123
EOF

print_success "Database initialized"

# ============================================================================
# 7. VERIFICATION
# ============================================================================

print_header "Step 7: Verifying Installation"

print_info "Checking Node.js files..."
node -c backend/server.js 2>&1 && print_success "backend/server.js syntax OK" || print_error "Syntax error in backend/server.js"

print_info "Checking Python scheduler..."
source venv/bin/activate
python -c "from scheduler import solve_timetable; print('✓ Scheduler module loaded')" && print_success "Python scheduler ready" || print_error "Failed to load scheduler"

# ============================================================================
# 8. STARTUP INSTRUCTIONS
# ============================================================================

print_header "Installation Complete! 🎉"

echo -e "${GREEN}Project is ready to run. Choose one of the following:${NC}\n"

echo -e "${YELLOW}Option 1: Start server directly${NC}"
echo "  $ npm start"
echo ""

echo -e "${YELLOW}Option 2: Start server with custom Python path${NC}"
echo "  $ PYTHON_PATH='./venv/bin/python' npm start"
echo ""

echo -e "${YELLOW}Option 3: Use npm scripts (if available)${NC}"
echo "  $ npm run dev    # Development mode"
echo "  $ npm run build  # Build/prepare"
echo ""

echo -e "${GREEN}Database Information:${NC}"
echo "  URL: postgresql://timetable_user:timetable123@localhost:5432/timetable_db"
echo ""

echo -e "${GREEN}Default Admin Credentials:${NC}"
echo "  Username: admin"
echo "  Email: admin@timetable.local"
echo "  Password: Admin@123"
echo ""

echo -e "${GREEN}Access the application at:${NC}"
echo "  http://localhost:3000"
echo ""

echo -e "${BLUE}Next steps:${NC}"
echo "  1. Start the server: npm start"
echo "  2. Open http://localhost:3000 in your browser"
echo "  3. Login with admin credentials above"
echo "  4. Create a timetable by filling the form"
echo "  5. Click 'Create & Schedule' to generate the timetable"
echo ""
