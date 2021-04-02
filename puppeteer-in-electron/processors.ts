import {app} from 'electron'

export const initPuppeteerInElectron = (port: number) => {
  if (!app) {
    throw new Error("The parameter 'app' was not passed in. " +
      "This may indicate that you are running in node rather than electron.");
  }

  if (app.isReady()) {
    throw new Error("Must be called at startup before the electron app is ready.");
  }

  if (port < 0 || port > 65535) {
    throw new Error(`Invalid port ${port}.`);
  }

  if (app.commandLine.getSwitchValue("remote-debugging-port")) {
    throw new Error("The electron application is already listening on a port. Double `initialize`?");
  }

  app.commandLine.appendSwitch(
    "remote-debugging-port",
    `${port}`
  );
  app.commandLine.appendSwitch(
    "remote-debugging-address",
    "127.0.0.1"
  );
  const electronMajor = parseInt(
    app.getVersion().split(".")[0],
    10
  );
  // NetworkService crashes in electron 6.
  if (electronMajor >= 7) {
    app.commandLine.appendSwitch(
      "enable-features",
      "NetworkService"
    );
  }

  return true;
}