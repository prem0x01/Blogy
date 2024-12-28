package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"my-blog-app/backend/models"
	"my-blog-app/backend/utils"

	"github.com/gin-gonic/gin"
)

type PostHandler struct {
	db *sql.DB
}

func NewPostHandler(db *sql.DB) *PostHandler {
	return &PostHandler{db: db}
}

func (h *PostHandler) GetPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * pageSize

	posts, total, err := h.getPosts(pageSize, offset)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	utils.PaginatedSuccessResponse(c, posts, total, page, pageSize)
}

func (h *PostHandler) GetPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	post, err := h.getPostByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.ErrorResponse(c, http.StatusNotFound, "Post not found")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch post")
		return
	}

	// Get comments for the post
	comments, err := h.getPostComments(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}
	post.Comments = comments

	utils.SuccessResponse(c, post)
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	var input models.PostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid input format")
		return
	}

	userID := c.GetInt64("user_id") // From auth middleware

	post := &models.Post{
		UserID:    userID,
		Title:     input.Title,
		Content:   input.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.createPost(post); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create post")
		return
	}

	utils.SuccessResponse(c, post)
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var input models.PostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid input format")
		return
	}

	userID := c.GetInt64("user_id") // From auth middleware

	post := &models.Post{
		ID:        id,
		UserID:    userID,
		Title:     input.Title,
		Content:   input.Content,
		UpdatedAt: time.Now(),
	}

	if err := h.updatePost(post); err != nil {
		if err == sql.ErrNoRows {
			utils.ErrorResponse(c, http.StatusNotFound, "Post not found or unauthorized")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update post")
		return
	}

	utils.SuccessResponse(c, post)
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := c.GetInt64("user_id") // From auth middleware

	if err := h.deletePost(postID, userID); err != nil {
		if err == sql.ErrNoRows {
			utils.ErrorResponse(c, http.StatusNotFound, "Post not found or unauthorized")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete post")
		return
	}

	utils.SuccessResponse(c, gin.H{"message": "Post deleted successfully"})
}

// Database helper methods
func (h *PostHandler) getPosts(limit, offset int) ([]*models.Post, int64, error) {
	var total int64
	err := h.db.QueryRow("SELECT COUNT(*) FROM posts WHERE status = 'published'").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := h.db.Query(`
        SELECT p.id, p.user_id, p.title, p.content, p.created_at, p.updated_at,
               u.username, u.email
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var posts []*models.Post
	for rows.Next() {
		post := &models.Post{Author: &models.User{}}
		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Title,
			&post.Content,
			&post.CreatedAt,
			&post.UpdatedAt,
			&post.Author.Username,
			&post.Author.Email,
		)
		if err != nil {
			return nil, 0, err
		}
		posts = append(posts, post)
	}

	return posts, total, nil
}

func (h *PostHandler) getPostByID(id int64) (*models.Post, error) {
	post := &models.Post{Author: &models.User{}}
	err := h.db.QueryRow(`
        SELECT p.id, p.user_id, p.title, p.content, p.created_at, p.updated_at,
               u.username, u.email
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ? AND p.status = 'published'
    `, id).Scan(
		&post.ID,
		&post.UserID,
		&post.Title,
		&post.Content,
		&post.CreatedAt,
		&post.UpdatedAt,
		&post.Author.Username,
		&post.Author.Email,
	)
	return post, err
}

func (h *PostHandler) getPostComments(postID int64) ([]models.Comment, error) {
	rows, err := h.db.Query(`
        SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
               u.username, u.email
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
    `, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		comment.Author = &models.User{}
		err := rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.Author.Username,
			&comment.Author.Email,
		)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

func (h *PostHandler) createPost(post *models.Post) error {
	result, err := h.db.Exec(`
        INSERT INTO posts (user_id, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    `, post.UserID, post.Title, post.Content, post.CreatedAt, post.UpdatedAt)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	post.ID = id
	return nil
}

func (h *PostHandler) updatePost(post *models.Post) error {
	result, err := h.db.Exec(`
        UPDATE posts 
        SET title = ?, content = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
    `, post.Title, post.Content, post.UpdatedAt, post.ID, post.UserID)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if affected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (h *PostHandler) deletePost(postID, userID int64) error {
	result, err := h.db.Exec(`
        DELETE FROM posts 
        WHERE id = ? AND user_id = ?
    `, postID, userID)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if affected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
