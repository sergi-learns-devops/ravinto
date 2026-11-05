#!/bin/sh
set -eu

# Apply pending migrations exactly once, before uvicorn forks its workers.
# This avoids several workers racing to migrate the same SQLite database.
alembic upgrade head

exec "$@"
