ab@ab-HP-Pavilion-TS-15-Notebook-PC:~/social-sentiment-pipeline$ curl -X POST http://localhost:3000/api/users/register \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}'
{"success":true,"data":{"id":"67a779f9cac28527c393fbf5","username":"testuser","email":"test@example.com"}}abab@ab-HP-Pavilion-TS-15-Notebook-PC:~/social-sentiment-pipeline$ curl -X POST http://localhost:3000/api/users/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "password123"
}'
{"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2E3NzlmOWNhYzI4NTI3YzM5M2ZiZjUiLCJpYXQiOjE3MzkwMjkwMDUsImV4cCI6MTczOTExNTQwNX0.7JXUAW2O4IWfMnKFJz_aNc12xyVGRg_AHJ_Drlc82CQ","user":{"id":"67a779f9cac28527c393fbf5","username":"testuser","email":"test@example.com"}}}ab@ab-HP-Pavilion-TS-15-Notebook-PC:~/social-sentiment-pipeline$ 


ab@ab-HP-Pavilion-TS-15-Notebook-PC:~/social-sentiment-pipeline$ curl -X POST http://localhost:3000/api/users/tokens \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2E3NzlmOWNhYzI4NTI3YzM5M2ZiZjUiLCJpYXQiOjE3MzkwMjk3MzYsImV4cCI6MTczOTExNjEzNn0.8hEOANsdSxz4MYezDWiNQKsPQBd3EB3_jj0f3JSJQwc" \
-H "Content-Type: application/json" \
-d '{
  "chainId": "ethereum",
  "tokenAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7"
}'
{"success":true,"data":[{"chainId":"ethereum","tokenAddress":"0xdac17f958d2ee523a2206206994597c13d831ec7","addedAt":"2025-02-08T15:49:58.567Z","_id":"67a77d26b098736282d0d01a"}]}ab@ab-HP-Pavilion-TS-15-Notebook-PC:~/social-sentiment-pipeline$ 



