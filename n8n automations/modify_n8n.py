import json
import uuid

def modify_n8n():
    # 1. Modify Knowledge Gap.json
    with open(r'd:\projects\Cogniva\n8n automations\Knowledge Gap.json', 'r', encoding='utf-8') as f:
        kg_data = json.load(f)

    for node in kg_data['nodes']:
        # Fix Execute a SQL query
        if node['name'] == 'Execute a SQL query':
            old_query = node['parameters']['query']
            node['parameters']['query'] = """INSERT INTO knowledge_gaps
    (unanswered_query, department, attempt_count)
VALUES
    ($1, $2, 1)
ON CONFLICT (unanswered_query)
DO UPDATE SET
    attempt_count = knowledge_gaps.attempt_count + 1
RETURNING *;"""
            
    # Add new HTTP Request node for Notification
    notification_node_id = str(uuid.uuid4())
    notification_node = {
        "parameters": {
            "method": "POST",
            "url": "http://host.docker.internal:8000/notifications/webhook",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": "={\n  \"user_id\": \"EMP-2026-8942\",\n  \"title\": \"Knowledge Gap Detected\",\n  \"message\": \"Query: {{ $json.unanswered_query }}\\nDepartment: {{ $json.department }}\\nEscalation hit (Count: {{ $json.attempt_count }}).\"\n}",
            "options": {}
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.5,
        "position": [3344, -300], # Above the email node
        "id": notification_node_id,
        "name": "Send In-App Notification"
    }
    kg_data['nodes'].append(notification_node)
    
    # Adjust connections
    # We want Check Knowledge Gap Count (true) -> Send In-App Notification -> Send an Email
    connections = kg_data['connections']
    
    # Find what Check Knowledge Gap Count connects to on true branch
    # True branch is usually index 0
    if "Check Knowledge Gap Count" in connections:
        connections["Check Knowledge Gap Count"]["main"][0] = [
            {"node": "Send In-App Notification", "type": "main", "index": 0}
        ]
    
    # Send In-App Notification connects to Send an Email
    connections["Send In-App Notification"] = {
        "main": [
            [{"node": "Send an Email", "type": "main", "index": 0}]
        ]
    }

    with open(r'd:\projects\Cogniva\n8n automations\Knowledge Gap.json', 'w', encoding='utf-8') as f:
        json.dump(kg_data, f, indent=2)

    # 2. Add same to Knowledge Ingestion? Wait, we haven't seen Knowledge Ingestion fully but user says:
    # "WORKFLOW 2 — KNOWLEDGE GAP AUTOMATION — FILE  The concept is: ... Notification"
    # Actually, Knowledge Ingestion is just File Upload handling... does it have the gap logic? Let's check!
    
if __name__ == "__main__":
    modify_n8n()
