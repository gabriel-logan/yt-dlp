package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type MethodLimit struct {
	Limiter *rate.Limiter
	BanTime int
}

var RateLimits = map[string]MethodLimit{
	"GET": {
		Limiter: rate.NewLimiter(10, 20),
		BanTime: 10,
	},
	"POST": {
		Limiter: rate.NewLimiter(3, 6),
		BanTime: 30,
	},
}

type clientState struct {
	Limiters    map[string]*rate.Limiter
	BannedUntil time.Time
	LastSeen    time.Time
}

var (
	mu      sync.Mutex
	clients = map[string]*clientState{}
)

func getClient(ip string) *clientState {
	mu.Lock()
	defer mu.Unlock()

	c, exists := clients[ip]
	if !exists {
		limiters := map[string]*rate.Limiter{}
		for method, cfg := range RateLimits {
			limiters[method] = rate.NewLimiter(cfg.Limiter.Limit(), cfg.Limiter.Burst())
		}

		c = &clientState{
			Limiters:    limiters,
			BannedUntil: time.Time{},
			LastSeen:    time.Now(),
		}

		clients[ip] = c
	}

	c.LastSeen = time.Now()
	return c
}

func isBanned(c *clientState) bool {
	return time.Now().Before(c.BannedUntil)
}

func banClient(c *clientState, seconds int) {
	c.BannedUntil = time.Now().Add(time.Duration(seconds) * time.Second)
}

func cleanupOldClients() {
	for {
		time.Sleep(1 * time.Minute)

		mu.Lock()
		for ip, c := range clients {
			if time.Since(c.LastSeen) > 5*time.Minute {
				delete(clients, ip)
			}
		}
		mu.Unlock()
	}
}

func RateLimit(next http.Handler) http.Handler {
	go cleanupOldClients()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			http.Error(w, "Invalid IP address", http.StatusBadRequest)
			return
		}

		method := r.Method
		cfg, exists := RateLimits[method]
		if !exists {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		client := getClient(ip)

		if isBanned(client) {
			http.Error(w, "Too Many Requests (temp ban)", http.StatusTooManyRequests)
			return
		}

		limiter := client.Limiters[method]

		if !limiter.Allow() {
			banClient(client, cfg.BanTime)
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}
