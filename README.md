#### Backend Setup
```bash
cd rotate-token-demo
go mod tidy
go run main.go

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev

# Frontend will start on http://localhost:3000
```

## Demo Credentials

Use these credentials to explore the application:

```
Username: demo
Password: password123
```

Or create a new account using the registration form.

### 2. **Token Refresh Flow**
```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    
    F->>B: API Request with Expired Token
    B->>F: 401 Unauthorized
    F->>B: POST /api/v1/auth/refresh
    B->>B: Validate Refresh Token
    B->>B: Generate New Token Pair
    B->>B: Revoke Old Refresh Token
    B->>F: Return New Tokens
    F->>B: Retry Original Request
    B->>F: Success Response
```