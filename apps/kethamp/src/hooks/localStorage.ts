"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";

const useLocalStorage = <T,>(key: string, initialValue: any, overWrite = false) => {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") {
      console.error("localStorage can be used only in client side");
      return initialValue;
    }
    
    if (overWrite) {
      return initialValue;
    } else {
      try {
        const currentValue = window.localStorage.getItem(key);
        if (currentValue) {
          return JSON.parse(currentValue) as T;
        }
      } catch (error) {
        console.error(
          `Error while reading localStorage item with key=${key}:`,
          error
        );

        return initialValue;
      }

      return initialValue;
    }
  });

  const previousKeyRef = React.useRef<string>("");

  React.useEffect(() => {
    const previousKey = previousKeyRef.current;

    if (previousKey !== key && previousKey) {
      try {
        window.localStorage.removeItem(previousKey);
      } catch (error) {
        console.error(
          `Error while removing localStorage item with key=${previousKey}:`,
          error
        );
      }
    }

    previousKeyRef.current = key;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(
        `Error while setting localStorage item with key=${key}:`,
        error
      );
    }
  }, [value, key, initialValue]);

  return [value, setValue] as const;
};

export default useLocalStorage;
