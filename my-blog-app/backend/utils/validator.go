package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"github.com/go-playground/validator/v10"
)

var Validate *validator.Validate

func init() {
	Validate = validator.New()

	Validate.RegisterValidation("password", validatePassword)
	Validate.RegisterValidation("username", validateUsername)
}

func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	fmt.Println("Password Validation Triggered:", password) // debug log
	var (
		hasMinLen  = false
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)
	if len(password) >= 8 {
		hasMinLen = true
	}
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	return hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial
}

func validateUsername(fl validator.FieldLevel) bool {
	username := fl.Field().String()
	match, _ := regexp.MatchString(`^[a-zA-Z0-9_]{3,20}$`, username)
	return match
}

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
