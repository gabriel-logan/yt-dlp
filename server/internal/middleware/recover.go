package middleware

import (
	"net/http"
)

func Recover(next http.Handler) http.Handler {
	return nil
}
