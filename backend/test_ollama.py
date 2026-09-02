import urllib.request
import json
import urllib.error

url = 'http://localhost:11434/api/generate'
data = json.dumps({'model': 'qwen2.5:3b', 'prompt': 'test', 'stream': False}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code)
    print(e.read().decode())
