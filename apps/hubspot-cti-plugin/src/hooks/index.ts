import { HubspotCTIContext } from "../components/HubspotCTIProvider";
import { IHubspotCTI } from "../services/hubspot";
import { useContext } from "react";

export const useHubspotCTI = (): IHubspotCTI => {
    const context = useContext(HubspotCTIContext);
    if(!context) throw new Error("no value found in Provider");
    return context;
}