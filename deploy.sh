#!/bin/bash

if [ -z "$1" ]; then
	echo "Brak opisu commita."
	exit 1
fi

set -e

npm run build
npm run prepack
npm run prepare

git add .
git commit -m "$1"
git push -u origin main

