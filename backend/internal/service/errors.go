package service

import "errors"

var (
	ErrNotFound           = errors.New("not found")
	ErrConflict           = errors.New("conflict")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountPending     = errors.New("account pending approval")
	ErrAccountDisabled    = errors.New("account disabled")
	ErrForbidden          = errors.New("forbidden")
	ErrUnsupportedMedia   = errors.New("unsupported media type")
)
