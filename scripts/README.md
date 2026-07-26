# Zincy Operations Toolkit

Operational scripts for managing the Zincy Corporation Production environment.

## Scripts

- backup-prod-db.sh — Creates and validates a compressed Production database backup.
- restore-prod-db.sh — Restores a Production backup into a temporary test database.
- deploy-prod.sh — Safely deploys the latest main branch to Production.
- docker-status.sh — Displays Production container and health status.
- docker-logs.sh — Displays logs for Production services.
- cleanup-docker.sh — Removes unused Docker build cache and images safely.

## Production Directory

/home/agrawalsubhash0222/zincy

## Production Compose Files

- compose.yml
- docker-compose.prod.yml
- .env.prod

## Notes

- Never commit `.env.prod`.
- Never commit `backups/`.
- Never commit runtime logs.
- Always test a restore after verifying backups.