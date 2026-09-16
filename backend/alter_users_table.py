import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.postgres import engine
from sqlalchemy import text

def alter_table():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_password VARCHAR(255);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS pwd_reset_requested BOOLEAN DEFAULT FALSE;"))
        
        # Set default recovery passwords for any existing accounts if null
        conn.execute(text("UPDATE users SET recovery_password = 'Password@123' WHERE recovery_password IS NULL AND user_type = 'employee';"))
        conn.execute(text("UPDATE users SET recovery_password = 'Admin@123' WHERE recovery_password IS NULL AND user_type = 'org_admin';"))
        conn.execute(text("UPDATE users SET recovery_password = 'CognivaAdmin@34' WHERE recovery_password IS NULL AND user_type = 'cogniva_admin';"))
        conn.commit()
        print("Users table successfully upgraded with recovery_password and pwd_reset_requested!")

if __name__ == "__main__":
    alter_table()
