
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
