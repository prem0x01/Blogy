package models

import (
	"time"

	"github.com/prem0x01/Blogy/utils"
)

type Comment struct {
	ID        int64     `json:"id" db:"id"`
	PostID    int64     `json:"post_id" db:"post_id"`
	UserID    int64     `json:"user_id" db:"user_id"`
	Content   string    `json:"content" db:"content" validate:"required,min=1,max=1000"`
	Author    *User     `json:"author,omitempty" db:"-"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type CommentInput struct {
	Content string `json:"content" validate:"required,min=1,max=1000"`
}

func (c *Comment) Validate() error {
	return utils.Validate.Struct(c)
}
