import { CustomizationProvider } from "@twilio-paste/core/customization";
import { HubspotCTIProvider } from "components/HubspotCTIProvider";
import { Flex } from "@twilio/flex-ui/src/FlexGlobal";
import { logToConsole, PLUGIN_NAME } from "./utils";
import { FlexPlugin } from "@twilio/flex-plugin";
import { z } from "zod";

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
      logToConsole("not running inside iframe, plugin will not load", "warn");
      return;
    }

    const EnvSchema = z.object({
      plugin_flex_hubspot_cti: z.object({
        HUBSPOT_CTI_HOST_ORIGIN: z.string().url()
      })
    });

    const envFromConfigParseResult = EnvSchema.safeParse(manager.configuration);
    if(!envFromConfigParseResult.success){
      logToConsole("FATAL: required config not found, flex-hubspot-cti plugin cannont load", "error");
      console.error(envFromConfigParseResult.error);
      return;
    }
    const env = envFromConfigParseResult.data;
    logToConsole("loaded env OK");
    console.log(env);

    //create context wrapper for the hubspot CTI and wrap our whole app with it
    flex.setProviders({
      PasteThemeProvider: CustomizationProvider,
      CustomProvider: (RootComponent) => (props) => {
        return (
          <HubspotCTIProvider hubspotCtiHostOrigin={env.plugin_flex_hubspot_cti.HUBSPOT_CTI_HOST_ORIGIN}>
            <RootComponent {...props} />       
          </HubspotCTIProvider>
        )
      }
    });

    

    //hide panel two, window size will be too small within CTI
    flex.AgentDesktopView.defaultProps.showPanel2 = false;

    //TODO: add in some UI component to show current state
    // flex.MainHeader.Content.add(<IconButton key="next-key" icon="Link" onClick={() => alert("Hi")}></IconButton>, {
    //   align: "end",
    //   sortOrder: 1
    // });
  }
}
