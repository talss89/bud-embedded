import dotenv from 'dotenv';
export default function (source) {
    return dotenv.parse(source);
}
