import psycopg2

url='https://rpifa-2403-8600-c090-53-c984-b48-4b28-5bce.free.pinggy.net'
conn = psycopg2.connect('postgresql://neondb_owner:npg_pavIj3crNwi5@ep-gentle-band-b30ou82i-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require')
cur = conn.cursor()
cur.execute("INSERT INTO dynamic_tunnel (key, url, updated_at) VALUES ('active_n8n', %s, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, updated_at = CURRENT_TIMESTAMP;", (url,))
conn.commit()
conn.close()
print('DB Updated!')
