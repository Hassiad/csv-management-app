#!/bin/sh

# Replace API_URL placeholder with environment variable
if [ ! -z "$REACT_APP_API_URL" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|__API_URL__|$REACT_APP_API_URL|g" {} \;
fi

# Start nginx
exec nginx -g 'daemon off;'