import { type FC, createContext, useEffect, useState } from "react";
import { FlexEvent, HubspotEventSchema } from "shared";
import { logToConsole } from "../utils";
import React from "react";
import { ITask, Manager } from "@twilio/flex-ui";
import { z } from "zod";

const VoiceTaskAttributesSchema = z.object({
    call_sid: z.string().regex(/^CA[0-9a-zA-Z]{32}$/),
    from: z.string(),
    to: z.string(),
    direction: z.string()
});

type HubspotCTIStatus = "pending"|"ready"|"error";
interface IHubspotCTI {
    readonly status: HubspotCTIStatus;
    readonly errorMessage?: string;
    readonly outgoingRequest?: string;
    clearOutgoingRequest: () => void;
}

export const HubspotCTIContext = createContext<IHubspotCTI|undefined>(undefined);
export const HubspotCTIProvider: FC<{hubspotCtiHostOrigin: string}> = ({hubspotCtiHostOrigin, children}) => {
    
    const [status, setStatus] = useState<HubspotCTIStatus>("pending");
    const [errorMessage, setErrorMessage] = useState<string>();
    const [outgoingRequest, setOutgoingRequest] = useState<string>();
    
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
                    //TODO: make this real, i.e. trigger on event passed over from HubSpot
                    setOutgoingRequest("+447776835151");
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

        const taskAcceptedListener = (task:ITask): void => {
            if(task.taskChannelUniqueName !== "voice") return;
            const parseAttributesResult = VoiceTaskAttributesSchema.safeParse(task.attributes);
            if(!parseAttributesResult.success){
                console.warn("failed to parse voice task attributes");
                console.warn(parseAttributesResult.error);
                return;
            }
            const voiceAttributes = parseAttributesResult.data;
            sendEvent({
                event: "IncomingCall",
                createEngagement: true,
                callDetails: {
                    callSid:  voiceAttributes.call_sid,
                    fromNumber: voiceAttributes.from,
                    toNumber: voiceAttributes.to,
                    callStartTime: task.dateCreated
                }
            });
        };

        const taskCompletedListener = (task: ITask) => {
            if(task.taskChannelUniqueName !== "voice") return;
            const parseAttributesResult = VoiceTaskAttributesSchema.safeParse(task.attributes);
            if(!parseAttributesResult.success){
                console.warn("failed to parse voice task attributes");
                console.warn(parseAttributesResult.error);
                return;
            }
            const voiceAttributes = parseAttributesResult.data;
            sendEvent({
                event: "CallEnded",
                callSid: voiceAttributes.call_sid,
                endedReason: "COMPLETED"
            });
        }

        const manager = Manager.getInstance();
        manager.events.addListener("taskAccepted", taskAcceptedListener);
        manager.events.addListener("taskCompleted", taskCompletedListener);


        return () => {
            window.removeEventListener("message", hubspotEventListener);
            manager.events.removeListener("taskAccepted", taskAcceptedListener);
            manager.events.removeListener("taskCompleted", taskCompletedListener);
        }
    }, [hubspotCtiHostOrigin]);
    
    return (
        <HubspotCTIContext.Provider value={{
            status,
            errorMessage,
            outgoingRequest,
            clearOutgoingRequest: () => setOutgoingRequest(undefined)
        }}>
            {children}
        </HubspotCTIContext.Provider>
    );
}