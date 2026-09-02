import urllib.request, urllib.error, json

req = urllib.request.Request(
    'http://127.0.0.1:5678/webhook/knowledge-gap', 
    data=json.dumps({'user_id':'EMP-2026-8942', 'query':'Test Query', 'department':'Engineering & Product'}).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try: 
    print(urllib.request.urlopen(req).read().decode()) 
except urllib.error.HTTPError as e: 
    print(f"Error {e.code}:", e.read().decode())
