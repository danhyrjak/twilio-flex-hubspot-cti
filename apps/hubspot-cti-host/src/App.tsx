import './App.css'
import { OnReadyEventSchema } from "shared";
import CallingExtensions from "@hubspot/calling-extensions-sdk";
import { useEffect, useState, type FC } from 'react';

const FLEX_REDIRECT_URL = "http://localhost:3000/agent-dashboard";
  
const App: FC = () => {
  const [status, setStatus] = useState<"pending"|"ready"|"error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [iframeLocation, setIframeLocation] = useState<"widget"|"remote"|"window"|"unknown">("unknown");
  const [hostUrl, setHostUrl] = useState("unknown");
  const [frameUrl, setFrameUrl] = useState<string>();

  useEffect(() => {
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
          setIframeLocation(eventParseResult.data.iframeLocation);
          setHostUrl(eventParseResult.data.hostUrl ?? "???");
          if(eventParseResult.data.iframeLocation === "window"){
            cti.initialized({
              engagementId: eventParseResult.data.engagementId,
              isLoggedIn: false
            });
            setFrameUrl(FLEX_REDIRECT_URL);
          }
          else{
            //TODO: add code to sync data from Flex and show readonly info + user status change widget
            console.warn(`iframeLocation is ${eventParseResult.data.iframeLocation} will DO NOTHING`);
            // extensions.resizeWidget({
            //   width: 250,
            //   height: 300
            // })
          }
        },
        onSetCallState: () => { },
        onSetWidgetUrlFailed: () => { },
        onUpdateEngagementFailed: () => { },
        onUpdateEngagementSucceeded: () => { },
        onVisibilityChanged: () => { },
        onFailed: () => { },
        defaultEventHandler: (event: unknown) => {
          console.log(`[${new Date().toISOString()}] - DefaultEventHandler`);
          console.log(event);
        }
      }
    });
    return () => {}
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
