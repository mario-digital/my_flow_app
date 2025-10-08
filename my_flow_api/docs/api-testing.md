# API Testing Guide

This guide outlines how to run the My Flow API locally, obtain a Logto JWT for authentication, and exercise each endpoint by cURL or Postman/Thunder Client.

## 1. Run the API Locally

1. Sign in to 1Password CLI (`op signin`), ensuring the environment has access to required secrets.
2. From the repository root, start the server with:  
   `op run -- uvicorn src.main:app --reload`
3. The FastAPI docs are available at http://localhost:8000/api/v1/docs and include schemas for all endpoints.

## 2. Obtain a Logto JWT Token

1. Log in to the Logto admin portal and navigate to **API Resources**.
2. Create or use an existing machine-to-machine app with the My Flow API audience.
3. Generate a `client_id` and `client_secret` and request a token:

```bash
curl --request POST \
  --url "<LOGTO_ENDPOINT>/oidc/token" \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=client_credentials' \
  --data 'client_id=<CLIENT_ID>' \
  --data 'client_secret=<CLIENT_SECRET>' \
  --data 'resource=<API_AUDIENCE>'
```

4. Use the `access_token` from the response in the `Authorization: Bearer <token>` header for each request below.

## 3. Example cURL Calls

Replace `<TOKEN>` with a valid JWT and IDs with real values returned from previous calls.

### Context Endpoints

```bash
# List contexts
curl --request GET \
  --url http://localhost:8000/api/v1/contexts?limit=20&offset=0 \
  --header 'Authorization: Bearer <TOKEN>'

# Create context
curl --request POST \
  --url http://localhost:8000/api/v1/contexts \
  --header 'Authorization: Bearer <TOKEN>' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Work",
    "color": "#3B82F6",
    "icon": "💼"
  }'

# Retrieve a context
curl --request GET \
  --url http://localhost:8000/api/v1/contexts/<CONTEXT_ID> \
  --header 'Authorization: Bearer <TOKEN>'

# Update a context
curl --request PUT \
  --url http://localhost:8000/api/v1/contexts/<CONTEXT_ID> \
  --header 'Authorization: Bearer <TOKEN>' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Updated Work",
    "color": "#2563EB"
  }'

# Delete a context
curl --request DELETE \
  --url http://localhost:8000/api/v1/contexts/<CONTEXT_ID> \
  --header 'Authorization: Bearer <TOKEN>'
```

### Flow Endpoints

```bash
# List flows within a context
curl --request GET \
  --url http://localhost:8000/api/v1/contexts/<CONTEXT_ID>/flows?include_completed=false \
  --header 'Authorization: Bearer <TOKEN>'

# Create a flow
curl --request POST \
  --url http://localhost:8000/api/v1/flows \
  --header 'Authorization: Bearer <TOKEN>' \
  --header 'Content-Type: application/json' \
  --data '{
    "context_id": "<CONTEXT_ID>",
    "title": "Review quarterly numbers",
    "priority": "high"
  }'

# Retrieve a flow
curl --request GET \
  --url http://localhost:8000/api/v1/flows/<FLOW_ID> \
  --header 'Authorization: Bearer <TOKEN>'

# Update a flow
curl --request PUT \
  --url http://localhost:8000/api/v1/flows/<FLOW_ID> \
  --header 'Authorization: Bearer <TOKEN>' \
  --header 'Content-Type: application/json' \
  --data '{
    "description": "Finalize deck",
    "priority": "medium"
  }'

# Delete a flow
curl --request DELETE \
  --url http://localhost:8000/api/v1/flows/<FLOW_ID> \
  --header 'Authorization: Bearer <TOKEN>'

# Mark a flow complete
curl --request PATCH \
  --url http://localhost:8000/api/v1/flows/<FLOW_ID>/complete \
  --header 'Authorization: Bearer <TOKEN>'
```

## 4. Postman / Thunder Client Collection

Import the JSON below into Postman or Thunder Client and update the `host`, `token`, and resource IDs in the collection variables.

```json
{
  "info": {
    "name": "My Flow API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "List Contexts",
      "request": {
        "method": "GET",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" }
        ],
        "url": "{{host}}/api/v1/contexts?limit=20&offset=0"
      }
    },
    {
      "name": "Create Context",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Work\",\n  \"color\": \"#3B82F6\",\n  \"icon\": \"💼\"\n}"
        },
        "url": "{{host}}/api/v1/contexts"
      }
    },
    {
      "name": "List Flows",
      "request": {
        "method": "GET",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" }
        ],
        "url": "{{host}}/api/v1/contexts/{{context_id}}/flows"
      }
    },
    {
      "name": "Create Flow",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"context_id\": \"{{context_id}}\",\n  \"title\": \"Review quarterly numbers\",\n  \"priority\": \"medium\"\n}"
        },
        "url": "{{host}}/api/v1/flows"
      }
    }
  ],
  "variable": [
    { "key": "host", "value": "http://localhost:8000" },
    { "key": "token", "value": "<TOKEN>" },
    { "key": "context_id", "value": "<CONTEXT_ID>" }
  ]
}
```

> Tip: Add additional requests for update/delete operations as needed. The OpenAPI documentation at `/api/v1/docs` provides schema details for request and response bodies.

## 5. Rate Limit Verification

Each endpoint is protected by slowapi rate limiting. To confirm limits, issue more than 10 POST requests to `/api/v1/contexts` within a minute and verify you receive a `429 Too Many Requests` response containing a `Retry-After` header and the JSON body defined above.
