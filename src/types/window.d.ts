interface Window {
  exposeSessionDetails: (appId: string) => Promise<string>;
}
