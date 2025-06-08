package models

import (
	"time"

	"github.com/prem0x01/Blogy/utils"
)

type Post struct {
	ID        int64     `json:"id" db:"id"`
	UserID    int64     `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title" validate:"required,min=3,max=200"`
	Content   string    `json:"content" db:"content" validate:"required,min=10"`
	Slug      string    `json:"slug" db:"slug"`
	Status    string    `json:"status" db:"status"`
	Views     int       `json:"views" db:"views"`
	Author    *User     `json:"author,omitempty" db:"-"`
	Comments  []Comment `json:"comments,omitempty" db:"-"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type PostInput struct {
	Title   string `json:"title" validate:"required,min=3,max=200"`
	Content string `json:"content" validate:"required,min=10"`
}

func (p *Post) Validate() error {
	return utils.Validate.Struct(p)
}
