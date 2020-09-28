

export const getChromeExecutablePath = () => {
  switch (process.platform) {
    case "win32":
      // return 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    case "darwin":
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    case "linux":
      return 'google-chrome';
    default:
      throw new Error(`Unsupported Platform: ${process.platform}`);
  }
}
