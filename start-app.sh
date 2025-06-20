#!/bin/bash

# iTunes Search App - Startup Script (Database + Local Next.js)
# This script starts the database in Docker and runs Next.js locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  iTunes Search App Launcher${NC}"
    echo -e "${BLUE}  Database: Docker${NC}"
    echo -e "${BLUE}  Frontend: Local${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi

    print_status "Docker and Docker Compose are installed ✓"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js with npm first."
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi

    print_status "Node.js $(node --version) and npm are installed ✓"
}

# Check if Docker daemon is running
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    print_status "Docker daemon is running ✓"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    print_status "Found package.json ✓"
}

# Install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install --legacy-peer-deps
    else
        print_status "Dependencies already installed ✓"
    fi
}

# Generate Prisma client if needed
setup_prisma() {
    if [ -d "prisma" ]; then
        print_status "Generating Prisma client..."
        npm run db:generate
        print_status "Prisma client generated ✓"
    fi
}

# Start database services
start_database() {
    print_status "Starting database services..."
    docker-compose up -d

    # Wait for database to be ready
    print_status "Waiting for database to start..."
    max_retries=30
    retries=0

    while [ $retries -lt $max_retries ]; do
        if docker-compose exec -T postgres pg_isready -U itunes_user -d itunes_search &> /dev/null; then
            print_status "Database is ready! ✓"
            break
        fi
        retries=$((retries + 1))
        echo -n "."
        sleep 2
    done

    if [ $retries -eq $max_retries ]; then
        print_error "Database failed to start within expected time"
        exit 1
    fi
}

# Push database schema
push_database_schema() {
    if [ -d "prisma" ]; then
        print_status "Pushing database schema..."
        npm run db:push
        print_status "Database schema updated ✓"
    fi
}

# Start Next.js development server
start_nextjs() {
    print_status "Starting Next.js development server..."
    echo ""
    echo -e "${GREEN}🚀 All Services Started Successfully!${NC}"
    echo ""
    echo -e "${BLUE}Available Services:${NC}"
    echo "┌─────────────────────────────────────────────┐"
    echo "│ Frontend:     http://localhost:3000         │"
    echo "│ Database:     localhost:5432                │"
    echo "│ Admin Panel:  http://localhost:8080         │"
    echo "└─────────────────────────────────────────────┘"
    echo ""
    echo -e "${BLUE}Database Admin Credentials:${NC}"
    echo "Email:    admin@example.com"
    echo "Password: admin123"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "• Stop database:    docker-compose down"
    echo "• View DB logs:     docker-compose logs -f postgres"
    echo "• Restart database: docker-compose restart"
    echo ""
    echo -e "${GREEN}Starting Next.js development server...${NC}"
    echo "Press Ctrl+C to stop the development server"
    echo ""

    # Start Next.js dev server
    npm run dev
}

# Stop services
stop_services() {
    print_status "Stopping database services..."
    docker-compose down
    print_status "Database services stopped ✓"
}

# Show service status
show_status() {
    print_status "Service status:"
    echo ""
    echo "Database Services:"
    docker-compose ps
    echo ""
    echo "Next.js: Check if running on http://localhost:3000"
}

# Main function
main() {
    print_header

    print_status "Checking prerequisites..."
    check_docker
    check_node
    check_docker_daemon
    check_directory

    print_status "Setting up application..."
    install_dependencies
    setup_prisma

    start_database
    push_database_schema
    start_nextjs
}

# Handle script interruption
cleanup() {
    echo ""
    print_warning "Received interrupt signal. Next.js server stopped."
    echo ""
    print_status "Database services are still running."
    echo "To stop database: docker-compose down"
    echo "To restart app: ./start-app.sh"
    exit 0
}

trap cleanup INT

# Check for command line arguments
case "${1:-}" in
    --help|-h)
        echo "iTunes Search App Startup Script"
        echo ""
        echo "Usage: ./start-app.sh [options]"
        echo ""
        echo "Options:"
        echo "  -h, --help     Show this help message"
        echo "  --stop         Stop database services"
        echo "  --status       Show service status"
        echo "  --db-only      Start only database services"
        echo ""
        echo "Examples:"
        echo "  ./start-app.sh              # Start database + Next.js"
        echo "  ./start-app.sh --stop       # Stop database services"
        echo "  ./start-app.sh --status     # Show service status"
        echo "  ./start-app.sh --db-only    # Start only database"
        echo ""
        exit 0
        ;;
    --stop)
        stop_services
        exit 0
        ;;
    --status)
        show_status
        exit 0
        ;;
    --db-only)
        print_header
        check_docker
        check_docker_daemon
        check_directory
        start_database
        echo ""
        print_status "Database services started. Run 'npm run dev' to start Next.js locally."
        exit 0
        ;;
    "")
        # No arguments, run main function
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Run './start-app.sh --help' for usage information."
        exit 1
        ;;
esac
