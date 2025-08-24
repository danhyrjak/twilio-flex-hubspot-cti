import { HubspotCTIContext } from "../components/HubspotCTIProvider";
import { useContext } from "react";

export const useHubspotCTI = () => {
    const context = useContext(HubspotCTIContext);
    if(!context) throw new Error("no value found in Provider");
    return context;
}