import json

with open("Knowledge Ingestion.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for n in data["nodes"]:
    if n["name"] == "HTTP Request" and "url" in n.get("parameters", {}):
        n["parameters"]["url"] = "http://host.docker.internal:8000/upload/"

with open("Knowledge Ingestion.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Fixed Docker Host")
