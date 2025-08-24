import { BroadcastEventSchema, type  BroadcastEvent } from "./schemas/broadcastEvents";
import { EnvSchema, type HubspotCTILocation } from "./schemas/shared";
import CallingExtensions from "@hubspot/calling-extensions-sdk";
import { OnReadyEventSchema } from "./schemas/hubspotEvents";
import { useEffect, useRef, useState, type FC } from 'react';
import { FlexEventSchema, type HubspotEvent } from "shared";
import { ulid } from "ulidx";
import './App.css'

type RemoteInfo = {
  lastPingRecievedAt: Date;
  dc: BroadcastChannel
}

const broadcastEvent = (toChannel: BroadcastChannel, event: BroadcastEvent) => {
  toChannel.postMessage(event);
}

const App: FC = () => {
  const [status, setStatus] = useState<"pending"|"ready"|"error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [iframeId, setIframeId] = useState<string>();
  const [iframeLocation, setIframeLocation] = useState<HubspotCTILocation>();
  const [frameUrl, setFrameUrl] = useState<string>();
  const [hostUrl, setHostUrl] = useState<string>();
  const [activeRemotesCount, setActiveRemotesCount] = useState(0);
  const [lastHeardFromWindow, setLastHeardFromWindow] = useState<{id: string, at: Date}>();
  const [lastPolledAt, setLastPolledAt] = useState<Date>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    const envParseResult = EnvSchema.safeParse(import.meta.env);
    if(!envParseResult.success){
      setStatus("error");
      setErrorMessage("failed to parse env");
      console.error("failed to parse env", envParseResult.error);
      return;
    }
    const env = envParseResult.data;
    const sourceId = ulid();
    setIframeId(sourceId);
    let sourceLocation: HubspotCTILocation|undefined;
    const CHANNEL_PREFIX = "twilio-flex-hubspot-cti_";
    const generateRemoteChannelName = (key: string) => {
      return `${CHANNEL_PREFIX}remote_${key}`;
    }
    const bc = new BroadcastChannel(`${CHANNEL_PREFIX}broadcast`);
    const knownRemotes: Map<string, RemoteInfo> = new Map();

    const getOrAddRemote = (key: string):RemoteInfo => {
      let remote = knownRemotes.get(key);
      if(!remote){
        knownRemotes.set(key, {
          dc: new BroadcastChannel(generateRemoteChannelName(key)),
          lastPingRecievedAt: new Date()
        });
        setActiveRemotesCount(knownRemotes.size);
        remote = knownRemotes.get(key);
        if(!remote){
          throw new Error("failed to get remote");
        }
      }
      return remote;
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
        case "READY":{
          if(e.sourceLocation === "window"){
            if(sourceLocation === "remote"){
              //do a PING, we have a new window thats ready
              broadcastEvent(bc, {
                event: "PING",
                sourceId,
                sourceLocation
              });
            }else{
              console.warn("Unexpected. Received ready event from another window?", e);
            }
          }else if(e.sourceLocation === "remote"){
            if(sourceLocation === "window"){
              //new remote, add it
              getOrAddRemote(e.sourceId); 
            }
          }
          return;
        }
        case "PING":{
          if(e.sourceLocation === "remote" && sourceLocation === "window"){
            const remote = getOrAddRemote(e.sourceId);
            remote.lastPingRecievedAt = new Date();
            broadcastEvent(remote.dc, {
              event: "PONG",
              sourceId,
              sourceLocation
            });
          }
          return;
        }
        case "PONG":{
          console.log("unexpected PONG on broadcast channel");
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
          
          if(eventParseResult.data.hostUrl){
            setHostUrl(eventParseResult.data.hostUrl);
          }

          sourceLocation = eventParseResult.data.iframeLocation;
          setIframeLocation(sourceLocation);

          broadcastEvent(bc, {
            event: "READY",
            sourceId,
            sourceLocation
          });

          switch(sourceLocation){
            case "window": {
              cti.initialized({
                engagementId: eventParseResult.data.engagementId,
                isLoggedIn: false
              });
              
              window.addEventListener("message", flexEventListener);
              const flexUrl = new URL(env.VITE_TWILIO_FLEX_ORIGIN);
              flexUrl.pathname = "/agent-dashboard";
              setFrameUrl(flexUrl.toString());
              return;
            }
            case "remote": {
              const rc = new BroadcastChannel(generateRemoteChannelName(sourceId));
              rc.onmessage = (messageEvent: MessageEvent<unknown>) => {
                const eventParseResult = BroadcastEventSchema.safeParse(messageEvent.data);
                if(!eventParseResult.success){
                  console.error("failed to parse event in dc channel handler");
                  console.error(eventParseResult.error);
                  return;
                }
                if(eventParseResult.data.sourceLocation === "window" && eventParseResult.data.event === "PONG"){
                  setLastHeardFromWindow({id: eventParseResult.data.sourceId, at: new Date()}); 
                }
              };
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

    const refreshInterval = window.setInterval(() => {
      setLastPolledAt(new Date());
      
      if(sourceLocation === "remote"){
        broadcastEvent(bc, {
          event: "PING",
          sourceId,
          sourceLocation
        });
        return;
      }
      
      if(sourceLocation === "window"){
        const tenSecondsAgo = new Date();
        tenSecondsAgo.setSeconds(tenSecondsAgo.getSeconds() - 10);
        const keysToRemove: string[] = [];
        knownRemotes.forEach((value, key) => {
          if(value.lastPingRecievedAt < tenSecondsAgo){
            keysToRemove.push(key);
          }
        });
        if(keysToRemove.length > 0){
          keysToRemove.forEach((key) => {
            knownRemotes.delete(key);
          });
          setActiveRemotesCount(knownRemotes.size);
        }
        return;
      }
    }, 5000);

    return () => {
      bc.close();
      window.removeEventListener("message", flexEventListener);
      window.clearInterval(refreshInterval);
    }
  }, []);

  if(frameUrl){
    return <iframe ref={iframeRef} src={frameUrl} allow="microphone" title="Flex" height="98%" width="98%" />;
  }

  return (
    <>
      <h1>Twilio Flex CTI</h1>
      <p>status: <b>{status}</b></p>
      {errorMessage ? <p>errorMessage: {errorMessage}</p> : null}
      <p>iframeLocation: <b>{iframeLocation}</b></p>
      <p>iframeId: <b>{iframeId}</b></p>
      {iframeLocation === "remote" && !lastHeardFromWindow ? <p>Window Not Connected</p> : null}
      {iframeLocation === "remote" && lastHeardFromWindow ? <p>Window: {lastHeardFromWindow.id}, last PONG'ed at: {lastHeardFromWindow.at.toISOString()}</p> : null}
      {iframeLocation === "remote" && lastHeardFromWindow && lastPolledAt && lastHeardFromWindow.at.valueOf() + 10000 < lastPolledAt.valueOf() ? <p><b>WINDOW GONE MISSING?</b></p> : null}
      <p>ActiveRemoteCount: {activeRemotesCount}</p>
      <p>current href: {window.location.href}</p>
      <p>hostUrl: {hostUrl}</p>
    </>
  );
}

export default App;
