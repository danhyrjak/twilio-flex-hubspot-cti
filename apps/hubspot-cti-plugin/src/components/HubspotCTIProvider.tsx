import { FC, createContext } from "react";
import { HubspotCTI } from "../services/hubspot-cti";

const hubspotCti = new HubspotCTI(true);
const HubspotCTIContext = createContext<HubspotCTI>(hubspotCti);

export const HubspotCTIProvider: FC = ({children}) => {
     return (
        <HubspotCTIContext.Provider value={hubspotCti}>
            {children}
        </HubspotCTIContext.Provider>
    );
}