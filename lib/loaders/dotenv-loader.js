import dotenv from 'dotenv';
export default function (source) {
    return JSON.stringify(dotenv.parse(source));
}
