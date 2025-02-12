ab@ab-HP-Pavilion-TS-15-Notebook-PC:~/social-sentiment-pipeline$ curl -X POST http://localhost:3000/api/users/login \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "password123"
}'
{"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2E3NzlmOWNhYzI4NTI3YzM5M2ZiZjUiLCJpYXQiOjE3MzkxOTE0NTYsImV4cCI6MTczOTI3Nzg1Nn0.ZnuSAl7dsODB9tXa3qVpn6FaWGXuBhATH7gw-2KiRkU","user":{"id":"67a779f9cac28527c393fbf5","username":"testuser","email":"test@example.com"}}}ab@ab-HP-Pavilion-TS-15-Notebook-PC:~/social-sentiment-pipeline$ 