import { FlexPlugin } from "@twilio/flex-plugin";
import { Flex } from "@twilio/flex-ui/src/FlexGlobal";
import { HELLO_MSG  } from "@twilio-flex-hubspot-cti/shared";

const PLUGIN_NAME = 'HubspotCtiPlugin';

const logToConsole = (message: string, level: "trace"|"warn"|"error" = "trace") => {
  const lineToLog = `[${new Date().toISOString()}] - ${PLUGIN_NAME}: ${message}`;
  switch(level){
    case "error":
      console.error(lineToLog);
      return;
      case "warn":
        console.warn(lineToLog);
      case "trace":
        console.log(lineToLog);
  }
}

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
    
    logToConsole(`shared message: ${HELLO_MSG}`);

    //remove this component always
    flex.AgentDesktopView.defaultProps.showPanel2 = false;

    //check if within an iframe and if so check if the expected one.
    
    const isInIFrame = window.location !== window.parent.location;
    if(!isInIFrame){
      logToConsole("not running inside iframe, plugin events will not be loaded", "warn");
      return;
    }
  }
}
