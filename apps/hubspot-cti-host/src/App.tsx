import './App.css'
import { OnReadyEventSchema } from "shared";
import CallingExtensions from "@hubspot/calling-extensions-sdk";
import { useEffect, useState, type FC } from 'react';
import { z } from 'zod';

const EnvSchema = z.object({
  VITE_TWILIO_FLEX_ORIGIN: z.string().url(),
  VITE_HUBSPOT_CTI_HOST_ORIGIN: z.string().url()
});
  
const App: FC = () => {
  const [status, setStatus] = useState<"pending"|"ready"|"error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [iframeLocation, setIframeLocation] = useState<"widget"|"remote"|"window"|"unknown">("unknown");
  const [hostUrl, setHostUrl] = useState("unknown");
  const [frameUrl, setFrameUrl] = useState<string>();

  useEffect(() => {
    const envParseResult = EnvSchema.safeParse(import.meta.env);
    if(!envParseResult.success){
      setStatus("error");
      setErrorMessage("failed to parse env");
      console.error("failed to parse env", envParseResult.error);
      return;
    }
    const env = envParseResult.data;
    const bc = new BroadcastChannel("twilio-flex-hubspot-cti");

    const flexEventListener = (event: MessageEvent<unknown>): void => {
      if(event.origin !== env.VITE_TWILIO_FLEX_ORIGIN){
        return;
      }
      console.log(event);
    }

    const cti = new CallingExtensions({
      debugMode: true,
      eventHandlers: {
        onCallerIdMatchFailed: () => { },
        onCallerIdMatchSucceeded: () => { },
        onCreateEngagementFailed: () => { },
        onCreateEngagementSucceeded: () => { },
        onDialNumber: () => { },
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
          console.log(`[${new Date().toISOString()}] - onReady fired`);
          console.log(event);
          const eventParseResult = OnReadyEventSchema.safeParse(event);
          if(!eventParseResult.success){
            setStatus("error");
            setErrorMessage("error parsing onReady Zod Schema")
            console.error(eventParseResult.error);
            return;
          }
          setHostUrl(eventParseResult.data.hostUrl ?? "???");
          const mode = eventParseResult.data.iframeLocation;
          setIframeLocation(mode);

          switch(mode){
            case "window": {
              cti.initialized({
                engagementId: eventParseResult.data.engagementId,
                isLoggedIn: false
              });
              window.addEventListener("message", flexEventListener);
              const flexUrl = new URL(env.VITE_TWILIO_FLEX_ORIGIN);
              flexUrl.pathname = "/agent-dashboard";
              setFrameUrl(flexUrl.toString());
              bc.postMessage({
                mode,
                event: "FLEX_IFRAME_LOADING"
              });
              return;
            }
            case "remote": {
              cti.resizeWidget({
                width: 565,
                height: 430
              });
              bc.postMessage({
                mode,
                event: "REMOTE_READY"
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

  if(frameUrl){
    return <iframe src={frameUrl} allow="microphone" title="Flex" height="98%" width="98%" />;
  }

  return (
    <>
      <h1>Twilio Flex CTI</h1>
      <p>status: <b>{status}</b></p>
      {errorMessage ? <p>errorMessage: {errorMessage}</p> : null}
      <p>iframeLocation: <b>{iframeLocation}</b></p>
      <p>current href: {window.location.href}</p>
      <p>hostUrl: {hostUrl}</p>
    </>
  );
}

export default App;
