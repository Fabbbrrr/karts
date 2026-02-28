#!/bin/sh
# Cache Busting Script - Adds version query strings to all assets
# This runs inside the Docker container during build

CACHE_VERSION=$(date +%s)
echo "Applying cache version: $CACHE_VERSION"

cd /usr/share/nginx/html

# Add version to CSS
echo "Versioning styles.css"
sed -i "s|href=\"styles.css\"|href=\"styles.css?v=$CACHE_VERSION\"|g" index.html

# Add version to main JS
echo "Versioning js/app.main.js"
sed -i "s|src=\"js/app.main.js\"|src=\"js/app.main.js?v=$CACHE_VERSION\"|g" index.html

# Add version to service worker registration
echo "Versioning service-worker.js"
sed -i "s|'service-worker.js'|'service-worker.js?v=$CACHE_VERSION'|g" index.html
sed -i "s|'/service-worker.js'|'/service-worker.js?v=$CACHE_VERSION'|g" index.html

# Add cache-busting meta tags to head
echo "Adding cache-control meta tags"
sed -i "/<head>/a <meta http-equiv=\"Cache-Control\" content=\"no-cache, no-store, must-revalidate\"><meta http-equiv=\"Pragma\" content=\"no-cache\"><meta http-equiv=\"Expires\" content=\"0\"><meta name=\"build-version\" content=\"$CACHE_VERSION\">" index.html

# Add build timestamp comment at end of file
echo "Adding build timestamp"
echo "<!-- Build Version: $CACHE_VERSION | Build Date: $(date) -->" >> index.html

echo "Cache busting applied successfully - Version: $CACHE_VERSION"

