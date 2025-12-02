package core

import (
	"os"
	"runtime"
)

// Returns the Go version string.
func GetGoVersion() string {
	return runtime.Version()
}

// Returns the number of logical CPUs usable by the current process.
func GetNumCPU() int {
	return runtime.NumCPU()
}

// Returns the operating system target.
func GetGOOS() string {
	return runtime.GOOS
}

// Returns the architecture target.
func GetGOARCH() string {
	return runtime.GOARCH
}

// Returns the number of goroutines currently existing.
func GetNumGoroutine() int {
	return runtime.NumGoroutine()
}

// Returns the number of cgo calls made by the current process.
func GetNumCgoCall() int64 {
	return runtime.NumCgoCall()
}

// Returns the current working directory.
func Getwd() string {
	cwd, err := os.Getwd()

	if err != nil {
		panic("failed to get current directory: " + err.Error())
	}

	return cwd
}

// Returns the compiler target.
func GetCompiler() string {
	return runtime.Compiler
}
