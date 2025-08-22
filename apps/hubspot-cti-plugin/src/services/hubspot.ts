type HubspotCTIStatus = "pending"|"ready"|"error";

export interface IHubspotCTI {
    readonly status: HubspotCTIStatus;
    readonly errorMessage?: string;
}

export class HubspotCTI implements IHubspotCTI {
    private _status: HubspotCTIStatus;
    private _errorMessage?: string;

    constructor(hubspotCtiHostOrigin: string){
        this._status = "pending";
        window.addEventListener("message", (event: MessageEvent<unknown>) => {
            if(event.origin !== hubspotCtiHostOrigin) return;
            

        });
    }

    public get status(): HubspotCTIStatus {
        return this._status;
    }

    public get errorMessage(): string|undefined {
        return this._errorMessage;
    }
}