curl -X POST https://network.learncard.com/api/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"boost\",
    \"recipient\": \"$RECIPIENT_EMAIL\",
    \"templateUri\": \"$TEMPLATE_URI\"
  }"
