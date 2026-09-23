package model
import "time"
type Status string
const(StatusPending Status="pending"; StatusSuccess Status="success"; StatusFailed Status="failed")
type Payment struct{Reference string; Email string; AmountKobo int64; Status Status; Provider string; AuthURL string; CreatedAt time.Time}
