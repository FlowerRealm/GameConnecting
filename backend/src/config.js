export const config = {
  "env": "development",
  "isDevelopment": true,
  "server": {
    "port": 12001,
    "frontendUrl": "http://localhost:12000",
    "apiKey": "FlowerRealmGameConnecting"
  },
  "supabase": {
    "url": "https://ybdxxwmqqextjxerkaej.supabase.co",
    "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZHh4d21xcWV4dGp4ZXJrYWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTAyMTAsImV4cCI6MjA2NTUyNjIxMH0.1dL_zuaEooFJeDkEtYoY436CFRmBGdpwRbqNgHz40VI"
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
