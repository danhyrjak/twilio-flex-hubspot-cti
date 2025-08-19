#!/bin/bash

echo "updating vite allowed hosts ..."
export __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=analyze-alot-que-should.trycloudflare.com
echo ""
echo "vite allowed hosts updated"
echo ""
echo "make sure to PATCH your Hubspot calling app registration settings with the URL:"
echo "https://$__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS/"
echo ""
echo "before running the vite dev server:"
echo "yarn hubspot-cti-host dev"
echo ""