/// <reference types="node" resolution-mode="require"/>
interface AssemblerOptions {
    section?: string;
    symbol?: string;
}
export default class Assembler {
    source: Buffer;
    constructor(source: Buffer);
    compile(fn: any, options?: AssemblerOptions): string;
}
export {};
