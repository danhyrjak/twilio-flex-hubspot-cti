#!/bin/bash
echo "== post-create.sh STARTED =="
echo ""
echo "Adding Twilio Sources to apt"
wget -qO- https://twilio-cli-prod.s3.amazonaws.com/twilio_pub.asc \
  | sudo apt-key add -
sudo touch /etc/apt/sources.list.d/twilio.list
echo 'deb https://twilio-cli-prod.s3.amazonaws.com/apt/ /' \
  | sudo tee /etc/apt/sources.list.d/twilio.list
sudo apt update
echo "Installing Twilio CLI ..."
sudo apt install -y twilio
echo "Installing Twilio Flex Plugins CLI Plugin ..."
twilio plugins:install @twilio-labs/plugin-flex
echo ""
echo "to get started run:'twilio login' to link up your Twilio Account."
echo ""
echo "== post-create.sh ENDED =="