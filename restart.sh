#!/bin/bash

services=(
  "schulolympiade.service"
  "edit-dashboard-server.service"
  "edit-emoji-server.service"
  "success-server.service"
  "success-server-emoji.service"
)

echo "Starte alle Services neu..."

for service in "${services[@]}"; do
  echo "Restarting $service..."
  sudo systemctl restart "$service"
  if [ $? -eq 0 ]; then
    echo "$service erfolgreich neu gestartet."
  else
    echo "Fehler beim Neustarten von $service!"
  fi
done

echo "Alle Services wurden neu gestartet."
