import { Ref } from 'vue';
export declare function useLazyRef<T>(source: Ref<T> | (() => T), delay: ((val: T) => number) | number): Ref<T, T>;
