curl -X POST https://network.learncard.com/api/inbox/issue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @request.json
