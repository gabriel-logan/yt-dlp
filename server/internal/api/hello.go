package api

import (
	"encoding/json"
	"net/http"
)

var helloHandlerResp = map[string]string{
	"message": "Hello World!",
}

func HelloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(helloHandlerResp)
}
