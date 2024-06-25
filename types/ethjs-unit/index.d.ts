declare module 'ethjs-unit' {
  export function toWei(value: string | number, unit: string): string;
  export function fromWei(value: string | number, unit: string): string;
}
