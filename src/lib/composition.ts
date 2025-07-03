import * as React from "react";

/**
 * A utility to compose multiple event handlers into a single event handler.
 * Run originalEventHandler first, then ourEventHandler unless prevented.
 */
function composeEventHandlers<E>(
  originalEventHandler?: (event: E) => void,
  ourEventHandler?: (event: E) => void,
  { checkForDefaultPrevented = true } = {},
) {
  return function handleEvent(event: E) {
    originalEventHandler?.(event);
    if (
      checkForDefaultPrevented === false ||
      !(event as unknown as Event).defaultPrevented
    ) {
      return ourEventHandler?.(event);
    }
  };
}

/**
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/compose-refs/src/compose-refs.tsx
 */
type PossibleRef<T> = React.Ref<T> | undefined;

/**
 * Set a given ref to a given value.
 * This utility takes care of different types of refs: callback refs and RefObject(s).
 */
function setRef<T>(ref: PossibleRef<T>, value: T): void | (() => void) {
  if (typeof ref === "function") {
    const result = ref(value);
    // Return the result if it's a function (cleanup), otherwise return void
    return typeof result === "function" ? result : undefined;
  }
  if (ref !== null && ref !== undefined && typeof ref === "object" && "current" in ref) {
    // Type assertion to handle both RefObject and MutableRefObject
    (ref as React.MutableRefObject<T>).current = value;
  }
  return undefined;
}

/**
 * A utility to compose multiple refs together.
 * Accepts callback refs and RefObject(s).
 */
function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node) => {
    const cleanups: Array<(() => void) | void> = [];
    let hasCleanup = false;

    // Collect all cleanup functions
    for (const ref of refs) {
      const cleanup = setRef(ref, node);
      cleanups.push(cleanup);
      if (typeof cleanup === "function") {
        hasCleanup = true;
      }
    }
    
    // React <19 will log an error to the console if a callback ref returns a
    // value. We don't use ref cleanups internally so this will only happen if a
    // user's ref callback returns a value, which we only expect if they are
    // using the cleanup functionality added in React 19.
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup === "function") {
            cleanup();
          } else {
            // Clean up the ref by setting it to null
            const ref = refs[i];
            if (ref && typeof ref !== "function") {
              setRef(ref, null);
            }
          }
        }
      };
    }
    
    // Return undefined if no cleanup is needed
    return undefined;
  };
}

/**
 * A custom hook that composes multiple refs.
 * Accepts callback refs and RefObject(s).
 */
function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeEventHandlers, composeRefs, useComposedRefs };