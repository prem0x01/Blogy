package database

import (
	"database/sql"
	"fmt"
	"time"

	"my-blog-app/backend/models"

	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	*sql.DB
}


type Config struct {
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}


func NewDatabase(dbPath string, config *Config) (*Database, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	db.SetMaxOpenConns(config.MaxOpenConns)
	db.SetMaxIdleConns(config.MaxIdleConns)
	db.SetConnMaxLifetime(config.ConnMaxLifetime)
	db.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to the database: %w", err)
	}

	if err := initializeSchema(db); err != nil {
		return nil, fmt.Errorf("error initializing schema: %w", err)
	}

	return &Database{db}, nil
}

func (db *Database) WithTx(fn func(*sql.Tx) error) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

func initializeSchema(db *sql.DB) error {
	pragmas := []string{
		"PRAGMA foreign_keys = ON;",
		"PRAGMA journal_mode = WAL;",
		"PRAGMA synchronous = NORMAL;",
		"PRAGMA temp_store = MEMORY;",
		"PRAGMA mmap_size = 30000000000;",
	}

	for _, pragma := range pragmas {
		if _, err := db.Exec(pragma); err != nil {
			return fmt.Errorf("error setting pragma: %w", err)
		}
	}

	tables := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			bio TEXT,
			avatar_url TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS posts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			slug TEXT UNIQUE NOT NULL,
			status TEXT CHECK(status IN ('draft', 'published', 'archived')) DEFAULT 'published',
			views INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			post_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			content TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS post_tags (
			post_id INTEGER NOT NULL,
			tag_id INTEGER NOT NULL,
			PRIMARY KEY (post_id, tag_id),
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS likes (
			user_id INTEGER NOT NULL,
			post_id INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, post_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
		);`,
	}

	for _, table := range tables {
		if _, err := db.Exec(table); err != nil {
			return fmt.Errorf("error creating table: %w", err)
		}
	}

	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);",
		"CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);",
		"CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);",
		"CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);",
		"CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);",
		"CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);",
		"CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);",
		"CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
		"CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
	}

	for _, index := range indexes {
		if _, err := db.Exec(index); err != nil {
			return fmt.Errorf("error creating index: %w", err)
		}
	}

	triggers := []string{
		`CREATE TRIGGER IF NOT EXISTS update_user_timestamp 
		AFTER UPDATE ON users
		BEGIN
			UPDATE users SET updated_at = CURRENT_TIMESTAMP 
			WHERE id = NEW.id;
		END;`,
		`CREATE TRIGGER IF NOT EXISTS update_post_timestamp 
		AFTER UPDATE ON posts
		BEGIN
			UPDATE posts SET updated_at = CURRENT_TIMESTAMP 
			WHERE id = NEW.id;
		END;`,
	}

	for _, trigger := range triggers {
		if _, err := db.Exec(trigger); err != nil {
			return fmt.Errorf("error creating trigger: %w", err)
		}
	}

	return nil
}

func (db *Database) GetUserByID(id int64) (*models.User, error) {
	user := &models.User{}
	err := db.QueryRow(`
		SELECT id, username, email, password_hash, bio, avatar_url, created_at, updated_at
		FROM users WHERE id = ?
	`, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Bio,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

