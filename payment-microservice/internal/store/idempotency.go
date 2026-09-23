package store
import ("sync"; "time")
type IdempotencyStore struct{mu sync.RWMutex; seen map[string]time.Time}
func NewIdempotencyStore()*IdempotencyStore{return &IdempotencyStore{seen:map[string]time.Time{}}}
func (s *IdempotencyStore)IsProcessed(k string)bool{s.mu.RLock(); _,ok:=s.seen[k]; s.mu.RUnlock(); return ok}
func (s *IdempotencyStore)MarkProcessed(k string){s.mu.Lock(); s.seen[k]=time.Now().UTC(); s.mu.Unlock()}
