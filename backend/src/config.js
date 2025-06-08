export const config = {
  "env": "production",
  "isDevelopment": false,
  "server": {
    "port": 3001,
    "frontendUrl": "https://game.flowerrealm.top",
    "apiKey": "FlowerRealmGameConnecting"
  },
  "database": {
    "host": "dpg-d0t5hq49c44c73956nd0-a",
    "port": 5432,
    "database": "gameconnecting",
    "username": "admin",
    "password": "s4RmJ4HnXrDGsGVGh0gM7UGMtpDUh8F4",
    "logging": false,
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
        "https://game.flowerrealm.top"
      ],
      "methods": [
        "GET",
        "POST"
      ],
      "credentials": true
    }
  }
};
