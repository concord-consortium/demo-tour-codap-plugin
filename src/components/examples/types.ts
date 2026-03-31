export interface ExampleProps {
  /** Append a line to the shared notification log */
  addNotification: (msg: string) => void;
  /**
   * Register (or clear) the handler that receives ALL CODAP notifications
   * forwarded by the App shell.  The notice object has the shape
   * `{ action, resource, values }`.
   */
  setNotificationHandler: (handler: ((notice: any) => void) | null) => void;
}
