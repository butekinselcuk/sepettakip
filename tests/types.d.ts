/**
 * SepetTakip - Tip Tanımlamaları
 * Bu dosya, üçüncü taraf modüller için tip bildirimleri içerir.
 */

declare module 'glob' {
  export function sync(pattern: string, options?: any): string[];
  export function hasMagic(pattern: string, options?: any): boolean;
  export function glob(pattern: string, options?: any, cb?: (err: Error | null, matches: string[]) => void): void;
  export function Glob(pattern: string, options?: any, cb?: (err: Error | null, matches: string[]) => void): void;
} 