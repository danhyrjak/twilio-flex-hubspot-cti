import { type IHubspotCTI, HubspotCTI } from "../services/hubspot";
import { type FC, createContext } from "react";
import React from "react";

export const HubspotCTIContext = createContext<IHubspotCTI|undefined>(undefined);
export const HubspotCTIProvider: FC<{hubspotCtiHostOrigin: string}> = ({hubspotCtiHostOrigin, children}) => {
     return (
        <HubspotCTIContext.Provider value={new HubspotCTI(hubspotCtiHostOrigin)}>
            {children}
        </HubspotCTIContext.Provider>
    );
}