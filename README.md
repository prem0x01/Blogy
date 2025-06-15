**============= BLOGY =======================**

Blogy is a blogging app in wich users can create blogs in .md style.
for backend I used golang and for frontend I used react.
in this app i want to integrate AI wich can help users to write blogs more fast.



**=== BACKEND ===**
in backed there are three models
1. user -> ID, Username, Email, Password, Bio, AvtarURL, CA(Created At), UP(Updated At)
2. post -> ID, UserID, Title, Content, Slug, Status, Views, Author, Comments[], CA, UA
3. comment -> ID, PostID, UserID, Content, Author, CA

[*] For registration I will take three inputs 1.Username, 2.Email, 3.Password
[ bcz it's a project for learning purpose I will not use any auth provider ]

[*] I am using gin router in this project

[*] for testing purpose now I am using sqlite for database
[*] after the project is ready I will shift to the postgress database
[*] I want to use redis also wich will help in faster caching
[*] the .env file will lokk like this
        DB_HOST=
        DB_PORT=
        DB_USER=
        DB_PASSWORD=
        DB_NAME=
        REDIS_HOST=



[*] Following are all api endpoints :-
[GIN-debug] GET    /metrics                  --> main.setupRouter.WrapH.func7 (7 handlers)
[GIN-debug] GET    /health                   --> main.setupRouter.func1 (7 handlers)
[GIN-debug] POST   /api/register             --> github.com/prem0x01/Blogy/handlers.(*AuthHandler).Register-fm (7 handlers)
[GIN-debug] POST   /api/login                --> github.com/prem0x01/Blogy/handlers.(*AuthHandler).Login-fm (7 handlers)
[GIN-debug] POST   /api/refresh              --> github.com/prem0x01/Blogy/handlers.(*AuthHandler).RefreshToken-fm (7 handlers)
[GIN-debug] GET    /api/posts                --> github.com/prem0x01/Blogy/handlers.(*PostHandler).GetPosts-fm (7 handlers)
[GIN-debug] GET    /api/posts/:id            --> github.com/prem0x01/Blogy/handlers.(*PostHandler).GetPost-fm (7 handlers)
[GIN-debug] GET    /api/posts/:id/comments   --> github.com/prem0x01/Blogy/handlers.(*CommentHandler).GetComments-fm (7 handlers)
[GIN-debug] POST   /api/posts                --> github.com/prem0x01/Blogy/handlers.(*PostHandler).CreatePost-fm (8 handlers)
[GIN-debug] PUT    /api/posts/:id            --> github.com/prem0x01/Blogy/handlers.(*PostHandler).UpdatePost-fm (8 handlers)
[GIN-debug] DELETE /api/posts/:id            --> github.com/prem0x01/Blogy/handlers.(*PostHandler).DeletePost-fm (8 handlers)
[GIN-debug] POST   /api/posts/:id/comments   --> github.com/prem0x01/Blogy/handlers.(*CommentHandler).CreateComment-fm (8 handlers)
[GIN-debug] DELETE /api/comments/:id         --> github.com/prem0x01/Blogy/handlers.(*CommentHandler).DeleteComment-fm (8 handlers)

[!] the /metrics and /health are the gin router endpoints rest are all created by me.



=== ERROR-SOLV ===

1) the regexp is not passing any password, I am using it like

           ` match, _ := regexp.MatchString(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`, password)`

   so I searched on stackoverflow and find out that this dont work properly so I needed to write custom validator

  ``` func validatePassword(fl validator.FieldLevel) bool {
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
    }```




