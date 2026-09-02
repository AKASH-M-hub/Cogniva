import json

with open("Knowledge Ingestion.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 1. Force n8n to save successful executions so they appear in the UI
if "settings" not in data:
    data["settings"] = {}
data["settings"]["saveDataSuccessExecution"] = "all"
data["settings"]["saveDataErrorExecution"] = "all"
data["settings"]["saveExecutionProgress"] = True

# 2. Fix the Respond to Webhook node so it passes the backend payload cleanly to React
for n in data["nodes"]:
    if n["type"] == "n8n-nodes-base.respondToWebhook":
        n["parameters"]["respondWith"] = "json"
        n["parameters"]["responseBody"] = "={{ $json }}"

with open("Knowledge Ingestion.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Updated Settings")
