import { basename } from 'path';
import chunks from 'buffer-chunks';
export default class Assembler {
    source;
    constructor(source) {
        this.source = source;
    }
    compile(fn, options = {}) {
        let output = "";
        const symbol = options.symbol ?? basename(fn).toLowerCase().replace(/\W/g, '_');
        const start_symbol = "_binary_" + symbol + "_start";
        const end_symbol = "_binary_" + symbol + "_end";
        const length_symbol = symbol + "_length";
        const length = this.source.byteLength;
        const section = options.section ?? ".rodata.embedded";
        output += `.data\n.section ${section}\n\n.global ${symbol}\n${symbol}:\n\n.global ${start_symbol}\n${start_symbol}:\n`;
        let words = chunks(this.source, 16);
        for (const word of words) {
            let bytes = [...word];
            bytes = bytes.map((b) => '0x' + b.toString(16).padStart(2, '0'));
            output += `.byte ${bytes.join(', ')}\n`;
        }
        output += `\n`;
        output += `.global ${end_symbol}\n${end_symbol}:\n\n`;
        output += `.global ${length_symbol}\n${length_symbol}:\n.word ${length}\n`;
        return output;
    }
}
