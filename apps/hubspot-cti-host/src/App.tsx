import CallingExtensions from "@hubspot/calling-extensions-sdk";
import { useEffect, useRef, useState, type FC } from 'react';
import { FlexEventSchema, type HubspotEvent } from "shared";
import { z } from "zod";
import './App.css'

const EnvSchema = z.object({
  VITE_TWILIO_FLEX_ORIGIN: z.string().url()
});

const HubspotCTILocationSchema = z.literal("window").or(z.literal("remote"));
type HubspotCTILocation = z.infer<typeof HubspotCTILocationSchema>;

const BroadcastOnlyEventSchema = z.object({
  event: z.literal("RemoteReady")
}).or(z.object({
  event: z.literal("WindowStatusUpdate"),
  data: z.object({
    status: z.boolean()
  })
}));
const BroadcastEventSchema = FlexEventSchema.or(BroadcastOnlyEventSchema);
type BroadcastEvent = z.infer<typeof BroadcastEventSchema>;

const OnReadyEventSchema = z.object({
    engagementId: z.number().optional(),
    hostUrl: z.string().optional(),
    iframeLocation: HubspotCTILocationSchema,
    portalId: z.number(),
    userId: z.number()
});

const App: FC = () => {
  const [status, setStatus] = useState<"pending"|"ready"|"error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [iframeLocation, setIframeLocation] = useState<HubspotCTILocation>();
  const [iframeUrl, setIframeUrl] = useState<string>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [lastHeardFromWindow, setLastHeardFromWindow] = useState<Date>();
  
  useEffect(() => {
    const envParseResult = EnvSchema.safeParse(import.meta.env);
    if(!envParseResult.success){
      setStatus("error");
      setErrorMessage("failed to parse env");
      console.error("failed to parse env", envParseResult.error);
      return;
    }
    const env = envParseResult.data;
    let sourceLocation: HubspotCTILocation|undefined;
    const bc = new BroadcastChannel("twilio-flex-hubspot-cti");
    
    const broadcastEvent = (event: BroadcastEvent) => {
      bc.postMessage(event);
    }
    
    bc.onmessage = (messageEvent: MessageEvent<unknown>) => {
      const eventParseResult = BroadcastEventSchema.safeParse(messageEvent.data);
      if(!eventParseResult.success){
        console.error("failed to parse event in broadcast channel handler");
        console.error(eventParseResult.error);
        return;
      }
      const e = eventParseResult.data;
      switch(e.event){
        case "RemoteReady":{
          if(sourceLocation !== "window"){
            return;
          }
          broadcastEvent({
            event: "WindowStatusUpdate",
            data: {
              status: true
            }
          });
          return;
        }
        case "WindowStatusUpdate": {
          if(sourceLocation !== "remote"){
            return;
          }
          setLastHeardFromWindow(new Date());
          return;
        }
        default: {
          console.warn("broadcast event not handled: ", e);
          //const exhaustiveCheck: never = e;
          //console.error("unhandled broadvsast event type", exhaustiveCheck);
        }
      }
    };

    const sendEventToFlex = (event: HubspotEvent) => {
      if(!iframeRef.current?.contentWindow){
        console.warn("flex iframe contentWindow not yet loaded, cannot send event");
        console.warn(event);
        return;
      }

      iframeRef.current.contentWindow.postMessage(event, {
        targetOrigin: env.VITE_TWILIO_FLEX_ORIGIN
      });
    }
    
    const flexEventListener = (event: MessageEvent<unknown>): void => {
      if(event.origin !== env.VITE_TWILIO_FLEX_ORIGIN) return;
      const parsedEventResult = FlexEventSchema.safeParse(event.data);
      if(!parsedEventResult.success){
        console.error("failed to parse flex event");
        console.error(parsedEventResult.error);
        console.log(event.data);
        return;
      }
      switch(parsedEventResult.data.event){
        case "PluginLoaded": {
          sendEventToFlex({event: "PluginLoadedEventReceived"});
          return;
        }
        case "IncomingCall": {
          cti.incomingCall({
            externalCallId: parsedEventResult.data.callDetails.callSid,
            fromNumber: parsedEventResult.data.callDetails.fromNumber,
            toNumber: parsedEventResult.data.callDetails.toNumber,
            callStartTime: parsedEventResult.data.callDetails.callStartTime.valueOf(),
            createEngagement: true
          });
          return;
        }
      default:
        console.log(`[${new Date().toISOString()}] - ${parsedEventResult.data.event} recieved!`)
          
      }
    }

    const cti = new CallingExtensions({
      debugMode: true,
      eventHandlers: {
        onCallerIdMatchFailed: (event: unknown) => { 
          console.log(`${new Date().toISOString()} onCallerIdMatchFailed fired`);
          console.log(event);
        },
        onCallerIdMatchSucceeded: (event: unknown) => {
            console.log(`${new Date().toISOString()} onCallerIdMatchSucceeded fired`);
            console.log(event);
         },
        onCreateEngagementFailed: (event: unknown) => { 
          console.log(`${new Date().toISOString()} onCreateEngagementFailed fired`);
          console.log(event);
        },
        onCreateEngagementSucceeded: (event: unknown) => { 
          console.log(`${new Date().toISOString()} onCreateEngagementSucceeded fired`);
          console.log(event);
        },
        onDialNumber: (event: unknown) => {
          console.log(`${new Date().toISOString()} onDialNumber fired`);
          console.log(event);
        },
        onEndCall: () => { },
        onEngagementCreated: () => { },
        onInitiateCallIdFailed: () => { },
        onInitiateCallIdSucceeded: () => { },
        onNavigateToRecordFailed: () => { },
        onUpdateAssociationsFailed: () => { },
        onPublishToChannelFailed: () => { },
        onPublishToChannelSucceeded: () => { },
        onFinalizeEngagementFailed: () => { },
        onFinalizeEngagementSucceeded: () => { },
        onReady: (event: unknown) => { 
          setStatus("ready");
          const eventParseResult = OnReadyEventSchema.safeParse(event);
          if(!eventParseResult.success){
            setStatus("error");
            setErrorMessage("error parsing onReady Zod Schema")
            console.error(eventParseResult.error);
            console.log(event);
            return;
          }

          sourceLocation = eventParseResult.data.iframeLocation;
          setIframeLocation(sourceLocation);

          switch(sourceLocation){
            case "window": {
              cti.initialized({
                engagementId: eventParseResult.data.engagementId,
                isLoggedIn: false
              });
              
              window.addEventListener("message", flexEventListener);
              const flexUrl = new URL(env.VITE_TWILIO_FLEX_ORIGIN);
              flexUrl.pathname = "/agent-dashboard";
              setIframeUrl(flexUrl.toString());
              return;
            }
            case "remote": {
              broadcastEvent({event: "RemoteReady"});
              cti.resizeWidget({
                width: 565,
                height: 430
              });
              return;
            }
            default: {
              setStatus("error");
              setErrorMessage(`unsupported iframeLocation: ${eventParseResult.data.iframeLocation}`);
              return;
            }
          }
        },
        onSetCallState: () => { },
        onSetWidgetUrlFailed: () => { },
        onUpdateEngagementFailed: () => { },
        onUpdateEngagementSucceeded: () => { },
        onVisibilityChanged: () => { },
        onFailed: () => { }
      }
    });

    return () => {
      bc.close();
      window.removeEventListener("message", flexEventListener);
    }
  }, []);

  if(iframeUrl){
    return <iframe ref={iframeRef} src={iframeUrl} allow="microphone" title="Flex" height="98%" width="98%" />;
  }

  return (
    <>
      <h1>Twilio Flex CTI</h1>
      <p>status: <b>{status}</b></p>
      {errorMessage ? <p>errorMessage: {errorMessage}</p> : null}
      {iframeLocation === "remote" && !lastHeardFromWindow ? <p>Window Not Sent Any Messages</p> : null}
      {iframeLocation === "remote" && lastHeardFromWindow ? <p>Window Sent Last Message At: {lastHeardFromWindow.toISOString()}</p> : null}
    </>
  );
}

export default App;
