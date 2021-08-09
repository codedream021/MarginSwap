#!/usr/bin/env bash

cp /home/MarginSwap/docs/nginx/maintenance_page.html /home/maintenance_page.html


cd /home/MarginSwap/

git stash
git pull

cd frontend/
npm install
npm run build

rm /home/maintenance_page.html