# Docker Setup Guide - Schulolympiade Dashboard

This guide will help you set up and run the Schulolympiade Dashboard using Docker.

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose V2 or later
- At least 2GB of free RAM
- At least 5GB of free disk space

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/bega-berlin/Schulolympiade-2025.git
cd Schulolympiade-2025
```

### 2. Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred settings:

```bash
nano .env  # or use your preferred text editor
```

**Important variables to configure:**

- `DB_HOST`: Database host (default: 192.168.100.73)
- `DB_PORT`: Database port (default: 3308)
- `DB_PASSWORD`: MySQL password (change from default!)
- `MYSQL_ROOT_PASSWORD`: MySQL root password (change from default!)
- `ADMIN_USERNAME`: Admin panel username
- `ADMIN_PASSWORD`: Admin panel password (change from default!)

### 3. Build and Start Services

Build the Docker images and start all services:

```bash
docker-compose up -d --build
```

This will start:
- MySQL database server
- MySQL backup service
- Dashboard service (port 3000)
- Edit Data Dashboard (port 3003)
- Edit Emoji Dashboard (port 3004)
- Success Emoji page (port 3005)
- Success Event page (port 3006)
- IP Logging service (port 3007)
- phpMyAdmin (port 8080)
- CloudBeaver (port 8081)

### 4. Verify Services are Running

Check the status of all services:

```bash
docker-compose ps
```

All services should show as "Up" or "healthy".

View logs for a specific service:

```bash
docker-compose logs -f dashboard
```

### 5. Access the Services

Once all services are running, you can access them at:

- **Main Dashboard**: http://localhost:3000
- **Edit Data Dashboard**: http://localhost:3003 (requires login)
- **Edit Emoji Dashboard**: http://localhost:3004 (requires login)
- **phpMyAdmin**: http://localhost:8080
- **CloudBeaver**: http://localhost:8081

## Configuration

### Environment Variables

All configuration is done through environment variables in the `.env` file:

#### Database Configuration
```env
DB_HOST=192.168.100.73
DB_PORT=3308
DB_USER=olympiade_user
DB_PASSWORD=olympiade2025  # Change this!
DB_NAME=schulolympiade
DB_CONNECTION_LIMIT=10
```

#### Service Ports
```env
DASHBOARD_PORT=3000
EDIT_DATA_PORT=3003
EDIT_EMOJI_PORT=3004
SUCCESS_EMOJI_PORT=3005
SUCCESS_EVENT_PORT=3006
IP_LOGGING_PORT=3007
```

#### Admin Credentials
```env
ADMIN_USERNAME=DauView25
ADMIN_PASSWORD=ongOlympiade#2025  # Change this!
```

#### Backup Configuration
```env
BACKUP_CRON_TIME=*/10 * * * *  # Every 10 minutes
BACKUP_MAX_COUNT=10
BACKUP_TIMEZONE=Europe/Berlin
```

### Database Initialization

Database tables are automatically created from SQL scripts in:
```
docker/mysql-init/
```

Place your `.sql` initialization scripts in this directory before first run.

## Managing Services

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Restart a Single Service
```bash
docker-compose restart dashboard
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f dashboard

# Last 100 lines
docker-compose logs --tail=100 dashboard
```

### Rebuild After Code Changes
```bash
docker-compose down
docker-compose up -d --build
```

## Database Management

### Backups

Automatic backups are created every 10 minutes (configurable) and stored in:
```
docker/mysql-backups/
```

The backup service keeps the last 10 backups by default.

### Manual Backup
```bash
docker exec schulolympiade_mysql mysqldump -u olympiade_user -polympiade2025 schulolympiade > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup
```bash
# Stop services
docker-compose down

# Start only MySQL
docker-compose up -d mysql

# Wait for MySQL to be ready
sleep 10

# Restore backup
docker exec -i schulolympiade_mysql mysql -u olympiade_user -polympiade2025 schulolympiade < your_backup.sql

# Start all services
docker-compose up -d
```

### Access MySQL Shell
```bash
docker exec -it schulolympiade_mysql mysql -u olympiade_user -polympiade2025 schulolympiade
```

## Troubleshooting

### Services Won't Start

1. Check if ports are already in use:
   ```bash
   netstat -tuln | grep -E '3000|3003|3004|3005|3006|3007|8080|8081|3308'
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs
   ```

3. Verify environment variables:
   ```bash
   docker-compose config
   ```

### Database Connection Issues

1. Check if MySQL is healthy:
   ```bash
   docker-compose ps mysql
   ```

2. Test database connection:
   ```bash
   docker exec schulolympiade_mysql mysqladmin ping -h localhost -u olympiade_user -polympiade2025
   ```

3. Check database logs:
   ```bash
   docker-compose logs mysql
   ```

### Services Can't Connect to Database

Wait for MySQL to be fully initialized (first startup can take 30-60 seconds):

```bash
# Watch MySQL logs until you see "ready for connections"
docker-compose logs -f mysql
```

Then restart the application services:
```bash
docker-compose restart dashboard edit_data edit_emoji
```

### Out of Disk Space

1. Remove old containers and images:
   ```bash
   docker system prune -a
   ```

2. Check disk usage:
   ```bash
   docker system df
   ```

3. Clean up old backups:
   ```bash
   rm docker/mysql-backups/backup_*.sql.gz
   ```

## Production Deployment

### Security Best Practices

1. **Change all default passwords** in `.env`:
   - `DB_PASSWORD`
   - `MYSQL_ROOT_PASSWORD`
   - `ADMIN_PASSWORD`

2. **Use strong passwords**: Mix of uppercase, lowercase, numbers, and symbols

3. **Restrict database access**:
   - Change `DB_HOST` to bind only to specific IP
   - Use firewall rules to restrict port access

4. **Enable HTTPS**: Use a reverse proxy (nginx) with SSL certificates

5. **Regular backups**: Verify backups are working and test restoration

6. **Update regularly**: Keep Docker images and code up to date

### Performance Optimization

1. **Increase connection pool**:
   ```env
   DB_CONNECTION_LIMIT=20
   ```

2. **Allocate more resources** in Docker:
   - Increase MySQL memory in `docker-compose.yml`
   - Add resource limits to prevent services from consuming too much

3. **Use volume mounts** for better I/O performance

### Monitoring

1. **Health checks**: All services include health checks that run automatically

2. **View health status**:
   ```bash
   docker-compose ps
   ```

3. **Application logs** are stored in:
   - Container logs: `docker-compose logs`
   - Application logs: `dashboard/public/data/*.txt`

## Updating the Application

### Update Code
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Update Docker Images
```bash
# Pull latest base images
docker-compose pull

# Rebuild with new base images
docker-compose up -d --build
```

## Uninstalling

### Remove All Containers and Volumes
```bash
# Stop and remove containers
docker-compose down

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Remove all data (WARNING: This deletes the database!)
rm -rf docker/mysql-backups/*
```

## Support

For issues or questions:
- Check the logs: `docker-compose logs`
- Review this documentation
- Contact: BEGA Team (Otto-Nagel-Gymnasium)

## License

Copyright (c) 2025 BEGA Team (Otto-Nagel-Gymnasium)

This software may not be used, copied, modified, distributed, or shared without express written permission from the author.
