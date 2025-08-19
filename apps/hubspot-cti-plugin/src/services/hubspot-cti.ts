type HubspotCTIStatus = "pending"|"ready"|"initialized"|"error";

export class HubspotCTI {
    private status: HubspotCTIStatus = "pending";
    private errorMessage?: string;

    constructor(debug: boolean){
    }

    public getStatus(): HubspotCTIStatus {
        return this.status;
    }

    public getErrorMessage(): string {
        return this.errorMessage ?? "";
    }
}