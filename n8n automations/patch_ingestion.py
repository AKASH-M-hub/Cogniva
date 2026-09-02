import json, uuid

with open("Knowledge Gap.json", "r", encoding="utf-8") as f:
    gap_data = json.load(f)
email_node = next((n for n in gap_data["nodes"] if n["type"] == "n8n-nodes-base.emailSend"), None)

with open("Knowledge Ingestion.json", "r", encoding="utf-8") as f:
    inj_data = json.load(f)

# Fix HTTP Request url
http_req = next((n for n in inj_data["nodes"] if n["name"] == "HTTP Request"), None)
if http_req:
    http_req["parameters"]["url"] = "http://172.17.0.1:8000/upload/"

if email_node:
    new_email_node = json.loads(json.dumps(email_node))
    new_email_node["id"] = str(uuid.uuid4())
    new_email_node["position"] = [800, 0]
    new_email_node["parameters"]["subject"] = "Cogniva Knowledge Ingestion Success"
    new_email_node["parameters"]["text"] = "A new document was successfully ingested.\n\nResponse: {{ $json.message }}"
    new_email_node["parameters"]["html"] = "<html><body><h3>Cogniva Knowledge Ingestion Success</h3><p>A new document was successfully ingested.</p><p>Response: {{ $json.message }}</p></body></html>"
    inj_data["nodes"].append(new_email_node)

    # Add connection: HTTP Request -> Respond to Webhook AND HTTP Request -> Send an Email
    if "HTTP Request" in inj_data["connections"]:
        inj_data["connections"]["HTTP Request"]["main"][0].append({"node": "Send an Email", "type": "main", "index": 0})

inj_data["active"] = True

with open("Knowledge Ingestion.json", "w", encoding="utf-8") as f:
    json.dump(inj_data, f, indent=2)
print("Patched INJ")
