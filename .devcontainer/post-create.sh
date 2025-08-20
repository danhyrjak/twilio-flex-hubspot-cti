#!/bin/bash
set -e

echo "== post-create.sh STARTED =="
echo ""
echo "Adding Twilio Sources to apt"
wget -qO- https://twilio-cli-prod.s3.amazonaws.com/twilio_pub.asc \
  | sudo apt-key add -
sudo touch /etc/apt/sources.list.d/twilio.list
echo 'deb https://twilio-cli-prod.s3.amazonaws.com/apt/ /' \
  | sudo tee /etc/apt/sources.list.d/twilio.list

echo ""
echo "Adding Cloudflare Sources to apt"
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list

echo ""
echo "updating package list"
sudo apt update

echo ""
echo "Installing cloudflared ..."
sudo apt install cloudflared
echo "cloudflared Installed." 

echo ""
echo "Installing Twilio CLI ..."
sudo apt install -y twilio
echo "Twilio CLI Installed."

echo ""
echo "Installing Twilio Flex Plugins - CLI Plugin ..."
twilio plugins:install @twilio-labs/plugin-flex
echo "CLI Plugin Installed."
echo ""
echo "To get started using the Twilio CLI run:'twilio login' to link up your Twilio Account."
echo ""
echo "To create a tunnel for the host run: '. ./scripts/create-tunnel.sh'"
echo "copy the generated https://your-quick-tunnel-subdomain.trycloudflare.com URL and update the"
echo "HUBSPOT_CTI_HOST_ORIGIN variable in the .env file for the hubspot-cti-host app."
echo "'Once updated run: yarn workspace hubspot-cti-host dev to start up the dev server"
echo "or run: yarn workspace hubspot-cti-host build to do a prodction build."
echo "Note: you will also need to PATCH your Hubspot calling app with the new URL for it to load correctly."
echo ""
echo "== post-create.sh ENDED =="