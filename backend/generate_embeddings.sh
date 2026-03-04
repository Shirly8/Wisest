#!/bin/bash
# Generate embeddings for all documents using Cohere API via curl
# NOTE: Set these environment variables before running:
# export SUPABASE_URL="your_url"
# export SUPABASE_KEY="your_key"
# export COHERE_API_KEY="your_key"

SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_KEY}"
COHERE_API_KEY="${COHERE_API_KEY}"

echo "============================================================"
echo "🔄 Generating Embeddings for RAG Documents"
echo "============================================================"
echo ""

# Fetch all documents
echo "📥 Fetching documents from Supabase..."
DOCS=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/documents?select=id,content" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json")

COUNT=$(echo "$DOCS" | jq 'length')
echo "📊 Found $COUNT documents"
echo ""

if [ "$COUNT" -eq 0 ]; then
  echo "✅ No documents to process"
  exit 0
fi

echo "🔨 Generating embeddings using Cohere..."

UPDATED=0
ERRORS=0

# Process each document
echo "$DOCS" | jq -r '.[] | @base64' | while read -r row; do
  _jq() {
    echo "${row}" | base64 --decode | jq -r "${1}"
  }

  DOC_ID=$(_jq '.id')
  CONTENT=$(_jq '.content')

  # Call Cohere API for embedding
  EMBEDDING_RESPONSE=$(curl -s -X POST \
    "https://api.cohere.ai/v1/embed" \
    -H "Authorization: Bearer $COHERE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"texts\": [\"${CONTENT:0:500}\"],
      \"model\": \"embed-english-light-v3.0\",
      \"input_type\": \"search_document\"
    }")

  EMBEDDING=$(echo "$EMBEDDING_RESPONSE" | jq '.embeddings[0]')

  if [ -z "$EMBEDDING" ] || [ "$EMBEDDING" == "null" ]; then
    echo "  ✗ Error generating embedding for doc $DOC_ID"
    ((ERRORS++))
  else
    # Update document with embedding
    curl -s -X PATCH \
      "$SUPABASE_URL/rest/v1/documents?id=eq.$DOC_ID" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"embedding\": $EMBEDDING}" > /dev/null

    ((UPDATED++))
    echo "  ✓ Processed document $UPDATED"
  fi

  # Rate limiting
  sleep 1
done

echo ""
echo "============================================================"
echo "✅ Successfully generated $UPDATED embeddings!"
echo "⚠️  Errors: $ERRORS"
echo "============================================================"
