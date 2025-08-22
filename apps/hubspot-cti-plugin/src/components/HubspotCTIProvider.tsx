import { FC, createContext, useContext } from "react";
import { IHubspotCTI, HubspotCTI } from "../services/hubspot";
import React from "react";

const HubspotCTIContext = createContext<IHubspotCTI|undefined>(undefined);
export const HubspotCTIProvider: FC<{hubspotCtiHostOrigin: string}> = ({hubspotCtiHostOrigin, children}) => {
     return (
        <HubspotCTIContext.Provider value={new HubspotCTI(hubspotCtiHostOrigin)}>
            {children}
        </HubspotCTIContext.Provider>
    );
}

export const useHubspotCTIContext = (): IHubspotCTI => {
    const context = useContext(HubspotCTIContext);
    if(!context) throw new Error("no value found in Provider");
    return context;
}