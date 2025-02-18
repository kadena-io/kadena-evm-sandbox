/* eslint-disable @typescript-eslint/no-explicit-any */

export const maskAccountAddress = (address: string) => {
  if (!address) return "";

  return address.slice(0, 6) + "..." + address.slice(-4);
}

export const throttle = (callback: (...args: any) => any, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: any[]) {
    if (timeoutId === null) {
      callback(...args);
      timeoutId = setTimeout(() => {
        timeoutId = null;
      }, delay);
    }
  };
};
