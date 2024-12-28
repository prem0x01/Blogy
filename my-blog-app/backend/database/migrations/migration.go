package migrations

import (
	"database/sql"
	"fmt"
	"log"
)

type Migration struct {
	Version     int
	Description string
	SQL         string
}

var migrations = []Migration{
	{
		Version:     1,
		Description: "Initial schema",
		SQL:         initialSchema,
	},
	// Add more migrations as needed
}

func RunMigrations(db *sql.DB) error {
	// Create migrations table if it doesn't exist
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			version INTEGER PRIMARY KEY,
			description TEXT NOT NULL,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating migrations table: %w", err)
	}

	// Get current version
	var currentVersion int
	err = db.QueryRow("SELECT COALESCE(MAX(version), 0) FROM migrations").Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("error getting current version: %w", err)
	}

	// Run pending migrations
	for _, migration := range migrations {
		if migration.Version > currentVersion {
			log.Printf("Running migration %d: %s", migration.Version, migration.Description)

			tx, err := db.Begin()
			if err != nil {
				return fmt.Errorf("error starting transaction: %w", err)
			}

			if _, err := tx.Exec(migration.SQL); err != nil {
				tx.Rollback()
				return fmt.Errorf("error running migration %d: %w", migration.Version, err)
			}

			if _, err := tx.Exec(
				"INSERT INTO migrations (version, description) VALUES (?, ?)",
				migration.Version,
				migration.Description,
			); err != nil {
				tx.Rollback()
				return fmt.Errorf("error recording migration %d: %w", migration.Version, err)
			}

			if err := tx.Commit(); err != nil {
				return fmt.Errorf("error committing migration %d: %w", migration.Version, err)
			}

			log.Printf("Migration %d completed", migration.Version)
		}
	}

	return nil
}
