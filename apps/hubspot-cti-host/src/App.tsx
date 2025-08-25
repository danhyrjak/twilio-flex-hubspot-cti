/* eslint-disable @typescript-eslint/no-unused-vars */
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

const RemoteReadySchema = z.object({event: z.literal("RemoteReady")});

const WindowStateSchema = z.object({
  status: z.literal("unavaliable").or(z.literal("avaliable")).or(z.literal("oncall")),
  callSid: z.string().optional(),
  callDirection: z.literal("incoming").or(z.literal("outgoing")).optional()
});
type WindowState = z.infer<typeof WindowStateSchema>;

const WindowStatusUpdateSchema = z.object({
  event: z.literal("WindowStatusUpdate"),
  info: WindowStateSchema
});

const BroadcastEventSchema = RemoteReadySchema.or(WindowStatusUpdateSchema).or(FlexEventSchema);
type BroadcastEvent = z.infer<typeof BroadcastEventSchema>;

const OnReadyEventSchema = z.object({
    engagementId: z.number().optional(),
    hostUrl: z.string().optional(),
    iframeLocation: HubspotCTILocationSchema,
    portalId: z.number(),
    userId: z.number()
});

const OnCallerIdMatchSucceededSchema = z.object({
  callId: z.coerce.number(),
  callerIdMatches: z.array(z.object({
    callerIdType: z.string(),
    email: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    objectCoordinates: z.object({
      objectId: z.coerce.number(),
      objectTypeId: z.literal("0-1").or(z.literal("0-2")),
      portalId: z.coerce.number()
    })
  }))
});

const App: FC = () => {
  const [status, setStatus] = useState<"pending"|"ready"|"error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [iframeLocation, setIframeLocation] = useState<HubspotCTILocation>();
  const [iframeUrl, setIframeUrl] = useState<string>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [latestUpdateFromWindow, setLatestUpdateFromWindow] = useState<{recievedAt: Date, info: WindowState}>();
  
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
    let currentState: WindowState|undefined;
    const callSidToEngagementMap: Record<string, string> = {};
    const bc = new BroadcastChannel("twilio-flex-hubspot-cti");
    
    const broadcastWindowStatusUpdate = () => {
      if(!currentState){
        return;
      }
      const event: BroadcastEvent = {
        event: "WindowStatusUpdate",
        info: currentState
      };
      bc.postMessage(event);
    }

    const updateCurrentStateAndBroadcastIt = (updatedState: WindowState) => {
      currentState = {...updatedState};
      broadcastWindowStatusUpdate();
    } 

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
          broadcastWindowStatusUpdate();
          return;
        }
        case "WindowStatusUpdate": {
          if(sourceLocation !== "remote"){
            return;
          }
          setLatestUpdateFromWindow({recievedAt: new Date(), info: e.info});
          return;
        }
        default: {
          console.log(`[${new Date()}] - event recieved: ${e.event}`);
          console.log(e);
          return;
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
          updateCurrentStateAndBroadcastIt({
            status: "oncall",
            callDirection: "incoming",
            callSid: parsedEventResult.data.callDetails.callSid
          });
          return;
        }
        case "UserLoggedIn":
        case "UserAvailable": {
          updateCurrentStateAndBroadcastIt({
            status: "avaliable"
          });
          return;
        }
        case "UserLoggedOut":
        case "UserUnavailable": {
          updateCurrentStateAndBroadcastIt({
            status: "unavaliable"
          });
          return;
        }
        case "CallEnded": {
          const engagementId = callSidToEngagementMap[parsedEventResult.data.callSid];
          cti.callCompleted({
            externalCallId: parsedEventResult.data.callSid,
            engagementId
          });
          updateCurrentStateAndBroadcastIt({
            status: "avaliable"
          });
          return;
        }
        default: {
          const exhaustiveCheck: never = parsedEventResult.data;
          console.error("event not handled", exhaustiveCheck);
          return;
        }
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
            const eventParseResult = OnCallerIdMatchSucceededSchema.safeParse(event);
            if(!eventParseResult.success){
              console.warn("failed to parse event schema");
              console.warn(eventParseResult.error);
              console.log(event);
              return;
            }
            if(eventParseResult.data.callerIdMatches.length === 0){
              console.warn("no matches returned");
              return;
            }
            console.log(`navigating to ${eventParseResult.data.callerIdMatches[0].callerIdType} - ${eventParseResult.data.callerIdMatches[0].objectCoordinates.objectId}`);
            cti.navigateToRecord({
              objectCoordinates: eventParseResult.data.callerIdMatches[0].objectCoordinates
            });
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
                width: 450,
                height: 225
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
      <h2>Twilio Flex CTI</h2>
      <p>Please use the CTI Window to interact <br/>with Voice & Messaging Tasks</p>
      {/* <p>Status: <b>{status}</b> / <b>{latestUpdateFromWindow?.info.status}</b></p>
      {errorMessage ? <p>Error Message: {errorMessage}</p> : null}
      {iframeLocation === "remote" && latestUpdateFromWindow ? 
      <p>Last Update Recieved At: {latestUpdateFromWindow.recievedAt.toISOString()}
        <br/>
        <code>
          {JSON.stringify(latestUpdateFromWindow.info)}
        </code>
      </p> : null} */}
    </>
  );
}

export default App;
