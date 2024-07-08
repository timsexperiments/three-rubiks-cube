export interface CubeEventHandlersEventMap {
  keydown: {
    /** The key that was pressed down. */
    key: string;
  };
  mousedown: {
    /** The X position that the mouse down event occured at. */
    clientX: number;
    /** The Y position that the mouse down event occured at. */
    clientY: number;
  };
  mousemove: {
    /** The X position that the mouse down event occured at. */
    clientX: number;
    /** The Y position that the mouse down event occured at. */
    clientY: number;
  };
  mouseup: undefined;
}

/**
 * A custom event listener that dispacthes the correct events for the cube to listen to.
 *
 * This allows the cube to use a custom event listener when working in web workers.
 */
export interface CubeEventListener {
  addEventListener<K extends keyof CubeEventHandlersEventMap>(
    type: K,
    listener: (this: Window, ev: CubeEventHandlersEventMap[K]) => any,
  ): void;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
}
