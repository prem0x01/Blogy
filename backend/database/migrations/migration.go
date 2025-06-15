package migrations

import (
	"database/sql"
	"fmt"
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
}

func RunMigrations(db *sql.DB) error {
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

	var currentVersion int
	err = db.QueryRow("SELECT COALESCE(MAX(version), 0) FROM migrations").Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("error getting current version: %w", err)
	}

	for _, migration := range migrations {
		if migration.Version > currentVersion {
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
		}
	}

	return nil
}
