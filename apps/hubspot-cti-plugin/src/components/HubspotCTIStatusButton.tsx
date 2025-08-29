import { OutboundModal } from "./OutboundModal";
import { IconButton } from "@twilio/flex-ui";
import { Tooltip } from "@twilio-paste/core";
import { HubspotIcon } from "./HubspotIcon";
import { useHubspotCTI } from "../hooks";
import { type FC } from "react";

export const HubspotCTIStatusButton: FC = () => {
    const cti = useHubspotCTI();

    return (
    <>
    <OutboundModal/>
    <Tooltip text={`Hubspot CTI Status: ${cti.status}`}>
        <IconButton 
            icon={<HubspotIcon/>}
            size="small"
            style={{marginRight: "15px"}}
            onClick={() => {
                window.alert(`Hubspot CTI Status: ${cti.status}`);
            }}
        />
    </Tooltip>
    </>
    );
}