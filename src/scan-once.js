import { runScan } from "./scanner.js";

const result = await runScan();
console.log(JSON.stringify(result, null, 2));
