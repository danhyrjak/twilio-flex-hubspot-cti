import {FlexEvent, HubspotEventSchema} from "shared";
import { logToConsole } from "utils";

type HubspotCTIStatus = "pending"|"ready"|"error";

export interface IHubspotCTI {
    readonly status: HubspotCTIStatus;
    readonly errorMessage?: string;
}

export class HubspotCTI implements IHubspotCTI {
    private _status: HubspotCTIStatus;
    private _errorMessage?: string;
    private _hubspotCtiHostOrigin: string;

    private sendEvent(event: FlexEvent): void {
        window.parent.postMessage(event, {
            targetOrigin: this._hubspotCtiHostOrigin
        });
    }

    constructor(hubspotCtiHostOrigin: string){
        this._status = "pending";
        this._hubspotCtiHostOrigin = hubspotCtiHostOrigin;

        window.addEventListener("message", (event: MessageEvent<unknown>) => {
            if(event.origin !== this._hubspotCtiHostOrigin) return;
            
            const eventParseResult = HubspotEventSchema.safeParse(event.data);
            if(!eventParseResult.success){
                logToConsole("failed to parse event from hubspot-cti-host", "error");
                console.error(eventParseResult.error);
                return;
            }
            switch(eventParseResult.data.event){
                case "PluginLoadedEventReceived": {
                    this._status = "ready";
                    return;
                }
            }
        });

        const loadedEvent: FlexEvent = {
            event: "PluginLoaded"
        }
        this.sendEvent(loadedEvent);
    }

    public get status(): HubspotCTIStatus {
        return this._status;
    }

    public get errorMessage(): string|undefined {
        return this._errorMessage;
    }
}