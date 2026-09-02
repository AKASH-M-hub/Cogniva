import sys
sys.path.append('.')
from app.database.postgres import SessionLocal
from app.models.search_history import SearchHistory

db = SessionLocal()
results = db.query(SearchHistory).all()
out = [{'user_id': r.user_id, 'timestamp': str(r.timestamp), 'search_time': str(r.search_time)} for r in results]
with open('db_out_py.txt', 'w', encoding='utf-8') as f:
    f.write(str(out))
