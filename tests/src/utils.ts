export function waitSeconds(seconds: number) {
  return new Promise((resolve) => {
    let count = 0;
    const intervalId = setInterval(() => {
      count++;
      process.stdout.write('.');
      if (count === seconds) {
        clearInterval(intervalId);
        resolve(true);
      }
    }, 1000);
  });
}

/**
 * log a message with timestamp
 * can be used to wrap around return values
 * only the first argument is the message, all other arguments are passed to console.log
 * and returned so that they can be used in the calling function
 *
 * @param message - message to log
 * @param args - arguments to log
 * @returns - arguments
 */
export function createLogger({
  context,
  pretty = false,
}: {
  context?: string;
  pretty?: boolean;
}) {
  const getTimeString = () =>
    // timestamp hh:mm:ss:ms
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      fractionalSecondDigits: 3,
    });

  return <T>(message: string, arg?: T): T | undefined => {
    // if context is not provided, use the caller function name
    if (!context) {
      const stack = new Error().stack;
      if (stack) {
        const caller = stack.split('\n')[2].trim();
        const match = caller.match(/at (.+?) /);
        if (match) {
          context = match[1];
        }
      }
    }
    const logMessage = `[${getTimeString()}] ${context}: ${message}`;
    console.log(logMessage, pretty ? JSON.stringify(arg, null, 2) : arg);

    if (arg) {
      return arg;
    }
  };
}
