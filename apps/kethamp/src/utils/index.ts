export const maskAccountAddress = (address: string) => {
  if (!address) return "";

  return address.slice(0, 6) + "..." + address.slice(-4);
}
