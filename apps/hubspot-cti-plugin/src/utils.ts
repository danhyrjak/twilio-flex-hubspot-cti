export const PLUGIN_NAME = 'HubspotCtiPlugin';

export const logToConsole = (message: string, level: "trace"|"warn"|"error" = "trace") => {
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