import dotenv from 'dotenv';
import type { LoaderContext } from 'webpack';
interface Options {
}
export default function (this: LoaderContext<Options>, source: any): dotenv.DotenvParseOutput;
export {};
