#!/bin/sh

# Generate runtime config read by the browser
cat > /usr/share/nginx/html/config.js <<EOF
window.SPOT_PUBLIC_URL = "${SPOT_PUBLIC_URL}";
window.SPOT_INTERNAL_URL = "${SPOT_INTERNAL_URL}";
window.PUBLIC_PREFER_EXCEL = "${PUBLIC_PREFER_EXCEL}";
EOF
