package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prem0x01/Blogy/models"
	"github.com/prem0x01/Blogy/utils"
)

type CommentHandler struct {
	db *sql.DB
}

func NewCommentHandler(db *sql.DB) *CommentHandler {
	return &CommentHandler{db: db}
}

func (h *CommentHandler) GetComments(c *gin.Context) {
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * pageSize

	comments, total, err := h.getComments(postID, pageSize, offset)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}

	utils.PaginatedSuccessResponse(c, comments, total, page, pageSize)
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	var input models.CommentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid input")
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := c.GetInt64("user_id")

	comment := &models.Comment{
		PostID:  postID,
		UserID:  userID,
		Content: input.Content,
	}

	if err := h.createComment(comment); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create comment")
		return
	}

	utils.SuccessResponse(c, comment)
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	commentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	userID := c.GetInt64("user_id")

	// Check ownership
	comment, err := h.getCommentByID(commentID)
	if err == sql.ErrNoRows {
		utils.ErrorResponse(c, http.StatusNotFound, "Comment not found")
		return
	} else if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Database error")
		return
	}

	if comment.UserID != userID {
		utils.ErrorResponse(c, http.StatusForbidden, "Not authorized to delete this comment")
		return
	}

	if err := h.deleteComment(commentID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete comment")
		return
	}

	utils.SuccessResponse(c, gin.H{"message": "Comment deleted successfully"})
}

// Database helper methods
func (h *CommentHandler) getComments(postID int64, limit, offset int) ([]*models.Comment, int64, error) {
	var total int64
	if err := h.db.QueryRow("SELECT COUNT(*) FROM comments WHERE post_id = ?", postID).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := h.db.Query(`
		SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
			   u.username, u.email
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at DESC
		LIMIT ? OFFSET ?
	`, postID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var comments []*models.Comment
	for rows.Next() {
		comment := &models.Comment{Author: &models.User{}}
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
			return nil, 0, err
		}
		comments = append(comments, comment)
	}

	return comments, total, nil
}

func (h *CommentHandler) createComment(comment *models.Comment) error {
	result, err := h.db.Exec(`
		INSERT INTO comments (post_id, user_id, content, created_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP)
	`, comment.PostID, comment.UserID, comment.Content)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	comment.ID = id
	return nil
}

func (h *CommentHandler) getCommentByID(id int64) (*models.Comment, error) {
	comment := &models.Comment{}
	err := h.db.QueryRow(`
		SELECT id, post_id, user_id, content, created_at
		FROM comments
		WHERE id = ?
	`, id).Scan(
		&comment.ID,
		&comment.PostID,
		&comment.UserID,
		&comment.Content,
		&comment.CreatedAt,
	)
	return comment, err
}

func (h *CommentHandler) deleteComment(id int64) error {
	_, err := h.db.Exec("DELETE FROM comments WHERE id = ?", id)
	return err
}
