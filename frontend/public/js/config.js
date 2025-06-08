
export const config = {
  "isDevelopment": false,
  "backendUrl": "https://gameconnecting.onrender.com",
  "socketUrl": "wss://gameconnecting.onrender.com",
  "frontendUrl": "https://game.flowerrealm.top",
  "apiKey": "FlowerRealmGameConnecting",
  "socket": {
    "maxRetryAttempts": 3,
    "reconnectionDelay": 1000,
    "connectionTimeout": 5000,
    "heartbeatInterval": 30000
  }
};
