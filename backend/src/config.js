export const config = {
  "env": "development",
  "isDevelopment": true,
  "server": {
    "port": 3001,
    "frontendUrl": "http://localhost:3000",
    "apiKey": "FlowerRealmGameConnecting"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "gameconnecting",
    "username": "gameconnecting",
    "password": "your_password",
    "logging": true,
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    },
    "retryMax": 3
  },
  "auth": {
    "jwtSecret": "FlowerRealmGameConnectingJWTSecret_2025",
    "tokenExpireTime": "24h"
  },
  "socket": {
    "pingTimeout": 60000,
    "pingInterval": 25000,
    "cors": {
      "origin": [
        "http://localhost:3000"
      ],
      "methods": [
        "GET",
        "POST"
      ],
      "credentials": true
    }
  }
};
