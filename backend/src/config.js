export const config = {
  "env": "development",
  "isDevelopment": true,
  "server": {
    "port": 12001,
    "frontendUrl": "http://localhost:12000",
    "apiKey": "FlowerRealmGameConnecting"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "gameconnecting",
    "username": "gameconnecting",
    "password": "gameconnecting123",
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
        "http://localhost:12000"
      ],
      "methods": [
        "GET",
        "POST"
      ],
      "credentials": true
    }
  }
};
