import { HubspotCTIProvider } from "components/HubspotCTIProvider";
import { Flex } from "@twilio/flex-ui/src/FlexGlobal";
import { logToConsole, PLUGIN_NAME } from "./utils";
import { FlexPlugin } from "@twilio/flex-plugin";

export default class HubspotCtiPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
    logToConsole("in constructor for plugin");
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof Flex }
   */
  async init(flex: typeof Flex, manager: Flex.Manager): Promise<void> {    
    logToConsole("init STARTED");

    //check if within an iframe, if not DO NOT LOAD.
    if(window === window.top){
      logToConsole("not running inside iframe, plugin events will not be loaded", "warn");
      return;
    }

    //create context wrapper for the hubspot CTI and wrap our whole app with it
    flex.setProviders({
      CustomProvider: (RootComponent) => (props) => {
        return (
          <HubspotCTIProvider>
            <RootComponent {...props} />       
          </HubspotCTIProvider>
        )
      }
    });

    //hide panel two, window size will be too small
    flex.AgentDesktopView.defaultProps.showPanel2 = false;

    //TODO: add in some UI component to show current state
    // flex.MainHeader.Content.add(<IconButton key="next-key" icon="Link" onClick={() => alert("Hi")}></IconButton>, {
    //   align: "end",
    //   sortOrder: 1
    // });
  }
}
