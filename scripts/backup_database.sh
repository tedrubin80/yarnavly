#!/bin/bash

# =============================================================================
# DATABASE BACKUP SCRIPT FOR YARN MANAGEMENT SYSTEM
# =============================================================================

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/var/backups/yarn-management"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="yarn_management_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

echo "🗄️ Starting database backup..."
echo "Timestamp: $(date)"
echo "Backup file: $BACKUP_FILE"

# Create database backup
echo "📤 Creating PostgreSQL dump..."
if [ -n "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_FILE"
else
    # Fallback to individual connection parameters
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "${DB_HOST:-localhost}" \
        -p "${DB_PORT:-5432}" \
        -U "${DB_USER:-yarn_user}" \
        -d "${DB_NAME:-yarn_management}" \
        > "$BACKUP_DIR/$BACKUP_FILE"
fi

# Check if backup was created successfully
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "❌ Backup file was not created!"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "✅ Database dump created successfully (Size: $BACKUP_SIZE)"

# Compress the backup
echo "🗜️ Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
echo "✅ Backup compressed (Size: $COMPRESSED_SIZE)"

# Upload to cloud storage if configured
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$S3_BACKUP_BUCKET" ]; then
    echo "☁️ Uploading to AWS S3..."
    aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://$S3_BACKUP_BUCKET/database-backups/$COMPRESSED_FILE"
    if [ $? -eq 0 ]; then
        echo "✅ Backup uploaded to S3 successfully"
    else
        echo "❌ Failed to upload backup to S3"
    fi
fi

# Upload to Google Drive if configured
if [ -n "$GOOGLE_DRIVE_BACKUP" ] && [ "$GOOGLE_DRIVE_BACKUP" = "true" ]; then
    echo "☁️ Uploading to Google Drive..."
    # This would require additional Google Drive CLI setup
    echo "ℹ️ Google Drive upload not implemented yet"
fi

# Clean up old local backups
echo "🧹 Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "yarn_management_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "yarn_management_backup_*.sql.gz" | wc -l)
echo "📁 Local backups remaining: $REMAINING_BACKUPS"

# Clean up old S3 backups
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$S3_BACKUP_BUCKET" ]; then
    echo "🧹 Cleaning up old S3 backups..."
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    aws s3 ls "s3://$S3_BACKUP_BUCKET/database-backups/" | while read -r line; do
        FILE_DATE=$(echo $line | awk '{print $1}')
        FILE_NAME=$(echo $line | awk '{print $4}')
        if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]] && [[ -n "$FILE_NAME" ]]; then
            aws s3 rm "s3://$S3_BACKUP_BUCKET/database-backups/$FILE_NAME"
            echo "🗑️ Deleted old S3 backup: $FILE_NAME"
        fi
    done
fi

# Create backup log entry
echo "📝 Logging backup completion..."
echo "$(date): Backup completed - $COMPRESSED_FILE ($COMPRESSED_SIZE)" >> "$BACKUP_DIR/backup.log"

# Send notification if configured
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ Yarn Management backup completed: $COMPRESSED_FILE ($COMPRESSED_SIZE)\"}" \
        > /dev/null 2>&1 || true
fi

echo ""
echo "🎉 Backup completed successfully!"
echo "📁 Local file: $BACKUP_DIR/$COMPRESSED_FILE"
echo "📊 File size: $COMPRESSED_SIZE"
echo "⏰ Completed at: $(date)"

# Return success
exit 0