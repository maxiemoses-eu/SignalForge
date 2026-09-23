package store
import ("sync"; "github.com/maxiemoses-eu/signalforge/payment/internal/model")
type MemoryStore struct{mu sync.RWMutex; data map[string]*model.Payment}
func NewMemoryStore()*MemoryStore{return &MemoryStore{data:map[string]*model.Payment{}}}
func (s *MemoryStore)Save(p *model.Payment){s.mu.Lock(); s.data[p.Reference]=p; s.mu.Unlock()}
func (s *MemoryStore)Get(ref string)(*model.Payment,bool){s.mu.RLock(); p,ok:=s.data[ref]; s.mu.RUnlock(); return p,ok}
