import dotenv from 'dotenv';
dotenv.config();
console.log(process.env.PRIVATE_KEY)
export const sum = (a: number, b: number): number => a + b;
