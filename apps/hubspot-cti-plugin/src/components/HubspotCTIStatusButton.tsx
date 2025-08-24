import { IconButton } from "@twilio/flex-ui";
import { Tooltip } from "@twilio-paste/core";
//import { HubspotIcon } from "./HubspotIcon";
import { useHubspotCTI } from "../hooks";
import { type FC } from "react";

export const HubspotCTIStatusButton: FC = () => {
    const cti = useHubspotCTI();

    return (
    <Tooltip text={`Hubspot CTI Status: ${cti.status}`}>
        <IconButton 
            //icon={<HubspotIcon/>}
            icon="Agent"
            onClick={() => {
                window.alert(`Hubspot CTI Status: ${cti.status}`);
            }}
        />
    </Tooltip>
    );
}