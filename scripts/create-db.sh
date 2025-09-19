#!/bin/bash

# Create SQLite database from SQL file
sqlite3 assets/fooddelivery.db < assets/fooddelivery.sql

echo "Database created successfully: assets/fooddelivery.db"
