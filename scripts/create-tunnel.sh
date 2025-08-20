#!/bin/bash
echo "starting tunnel for use with hubspot-cti-host"
echo ""
echo "make sure to copy the tunnel URL into the .env file under apps/hubspot-cti-host directory"
echo "with the key VITE_HUBSPOT_CTI_HOST_ORIGIN before running the hubspot-cti-host vite dev server using:"
echo "yarn workspace hubspot-cti-host dev"
echo "or building a production run via:"
echo "yarn workspace hubspot-cti-host build"
echo ""
cloudflared tunnel --url http://localhost:5173