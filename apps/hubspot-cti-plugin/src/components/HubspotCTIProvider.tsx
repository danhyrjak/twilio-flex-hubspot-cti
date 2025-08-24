import { type FC, createContext, useEffect, useState } from "react";
import { FlexEvent, HubspotEventSchema } from "shared";
import { logToConsole } from "../utils";
import React from "react";

type HubspotCTIStatus = "pending"|"ready"|"error";
interface IHubspotCTI {
    readonly status: HubspotCTIStatus;
    readonly errorMessage?: string;
}

export const HubspotCTIContext = createContext<IHubspotCTI|undefined>(undefined);
export const HubspotCTIProvider: FC<{hubspotCtiHostOrigin: string}> = ({hubspotCtiHostOrigin, children}) => {
    
    const [status, setStatus] = useState<HubspotCTIStatus>("pending");
    const [errorMessage, setErrorMessage] = useState<string>();
    
    useEffect(() => {
        const sendEvent = (event: FlexEvent): void => {
            window.parent.postMessage(event, {
                targetOrigin: hubspotCtiHostOrigin
            });
        }

        const hubspotEventListener = (event: MessageEvent<unknown>) => {
            if(event.origin !== hubspotCtiHostOrigin) return;
            
            const eventParseResult = HubspotEventSchema.safeParse(event.data);
            if(!eventParseResult.success){
                logToConsole("failed to parse event from hubspot-cti-host", "error");
                console.error(eventParseResult.error);
                return;
            }
            switch(eventParseResult.data.event){
                case "PluginLoadedEventReceived": {
                    setStatus("ready");
                    sendEvent({
                        event: "UserLoggedIn"
                    });
                    return;
                }
            }
        };
        window.addEventListener("message", hubspotEventListener);
        sendEvent({
            event: "PluginLoaded"
        });

        return () => {
            window.removeEventListener("message", hubspotEventListener);
        }
    }, [hubspotCtiHostOrigin]);
    
    return (
        <HubspotCTIContext.Provider value={{
            status,
            errorMessage
        }}>
            {children}
        </HubspotCTIContext.Provider>
    );
}