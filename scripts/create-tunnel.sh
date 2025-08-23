#!/bin/bash
echo "starting tunnel for use with hubspot-cti-host ..."
echo ""
echo "hubspot-cti-host"
echo "to work with Hubspot the host vite app has to be run on a https:// address. Therefore we can use this cloudflare"
echo "tunnel to route resquests to this app. Before this will work you need to update the configuration on the app in"
echo "hubspot by doing a PATCH on your Hubspot calling app configuration with the new URL for it to load correctly."
echo ""
echo "hubspot-cti-plugin"
echo "make sure to copy the tunnel URL into the appConfig.js config file under the apps/hubspot-cti-plugin/public directory"
echo "at the object path: flex_hubspot_cti.HUBSPOT_CTI_HOST_ORIGIN beofre running workspace hubspot-cti-plugin start to start the local dev server."
echo "for production use the real origin must be added to Flex's config at this location. If it is not there the plugin will not load and will log an error."
echo ""
cloudflared tunnel --url http://localhost:5173