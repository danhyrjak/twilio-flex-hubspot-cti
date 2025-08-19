#!/bin/bash
echo "starting tunnel for use with hubspot-cti-host"
echo ""
echo "make sure to copy the tunnel domain into the set-host-env.sh script"
echo "and run this before running the hubspot-cti-host vite dev server"
echo ""
cloudflared tunnel --url http://localhost:5173