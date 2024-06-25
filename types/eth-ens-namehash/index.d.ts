declare module 'eth-ens-namehash' {
  export function hash(name: string): string;
  export function normalize(name: string): string;
}
