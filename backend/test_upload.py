import requests

resp = requests.post(
    "http://localhost:8000/upload/n8n-proxy",
    files={"file": ("dummy.txt", b"Test Content", "text/plain")}
)
print("Proxy response HTTP:", resp.status_code)
print("Proxy response Body:", resp.text)
