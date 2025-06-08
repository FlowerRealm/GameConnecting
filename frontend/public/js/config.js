
export const config = {
  "isDevelopment": false,
  "backendUrl": "http://localhost:3001",
  "socketUrl": "ws://localhost:3001",
  "frontendUrl": "http://localhost:3000",
  "apiKey": "FlowerRealmGameConnecting",
  "socket": {
    "maxRetryAttempts": 3,
    "reconnectionDelay": 1000,
    "connectionTimeout": 5000,
    "heartbeatInterval": 30000
  }
};
