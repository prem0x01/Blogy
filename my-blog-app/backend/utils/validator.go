package utils

import (
	"regexp"
	"strings"

	"github.com/go-playground/validator/v10"
)

var Validate *validator.Validate

func init() {
	Validate = validator.New()

	// Custom validation rules
	Validate.RegisterValidation("password", validatePassword)
	Validate.RegisterValidation("username", validateUsername)
}

func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	// At least 8 characters, 1 uppercase, 1 lowercase, 1 number
	match, _ := regexp.MatchString(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$`, password)
	return match
}

func validateUsername(fl validator.FieldLevel) bool {
	username := fl.Field().String()
	// 3-20 characters, letters, numbers, underscores
	match, _ := regexp.MatchString(`^[a-zA-Z0-9_]{3,20}$`, username)
	return match
}

// Helper function to format validation errors
func FormatValidationErrors(err error) string {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		var errorMessages []string
		for _, e := range validationErrors {
			switch e.Tag() {
			case "required":
				errorMessages = append(errorMessages,
					strings.ToLower(e.Field())+" is required")
			case "email":
				errorMessages = append(errorMessages,
					"invalid email format")
			case "password":
				errorMessages = append(errorMessages,
					"password must be at least 8 characters and contain "+
						"at least one uppercase letter, one lowercase letter, "+
						"and one number")
			case "username":
				errorMessages = append(errorMessages,
					"username must be 3-20 characters long and can only contain "+
						"letters, numbers, and underscores")
			default:
				errorMessages = append(errorMessages,
					strings.ToLower(e.Field())+" is invalid")
			}
		}
		return strings.Join(errorMessages, ", ")
	}
	return "validation error"
}
