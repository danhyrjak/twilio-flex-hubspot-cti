import { Button, Card, Combobox, Heading, Label, Modal, ModalBody, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading, Paragraph, Stack } from "@twilio-paste/core";
import { type FC } from "react";
import { useHubspotCTI } from "../hooks";

export const OutboundModal: FC = () => {
  const {outgoingRequest, clearOutgoingRequest} = useHubspotCTI();

  //TODO: load in from plugin
  const items = ["Office (404-882-8117)", "Direct Dial (404-882-1234)"];

  //TODO: make actions work

  return (
    <Modal ariaLabelledby="outbound-modal" isOpen={outgoingRequest !== undefined} onDismiss={() => clearOutgoingRequest()} size="default">
        <ModalHeader>
          <ModalHeading as="h3" id="outbound-modal">
            Select Outbound Channel
          </ModalHeading>
        </ModalHeader>
        <ModalBody>
            <Stack orientation="vertical" spacing="space30">
                <Card>
                    <Heading as="h4" variant="heading40">Voice Call</Heading>
                    <Paragraph>Make an outbound voice call to {outgoingRequest}.</Paragraph>
                    <Combobox items={items} initialSelectedItem={items[0]} labelText="Caller ID" />
                    <br/>
                    <Button variant="primary">Place Call</Button>
                </Card>
                <Card>
                    <Heading as="h4" variant="heading40">SMS Conversation</Heading>
                    <Paragraph>Create a new two way conversation with {outgoingRequest} over SMS.</Paragraph>
                    <Button variant="primary">Start Conversation</Button>
                </Card>
            </Stack>
        </ModalBody>
        <ModalFooter>
          <ModalFooterActions>
            <Button variant="secondary" onClick={() => clearOutgoingRequest()}>
              Cancel
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </Modal>
    );
}