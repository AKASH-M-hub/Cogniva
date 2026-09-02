import sys
from sqlalchemy import create_engine, text

def create_table_in_db(db_name):
    # Connect directly to specified db
    url = f"postgresql://postgres:AKASH2006@localhost:5432/{db_name}"
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS knowledge_gaps (
                    id SERIAL PRIMARY KEY,
                    unanswered_query VARCHAR(255) UNIQUE NOT NULL,
                    department VARCHAR(255),
                    attempt_count INT DEFAULT 1,
                    status VARCHAR(50) DEFAULT 'Pending Resolution',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.commit()
            print(f"Table created successfully in {db_name}")
    except Exception as e:
        print(f"Failed in {db_name}: {e}")

if __name__ == "__main__":
    create_table_in_db("cogniva_db")
    create_table_in_db("postgres")
