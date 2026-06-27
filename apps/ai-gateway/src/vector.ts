import { initDocsDB, queryDocs } from "./db/vector";

await initDocsDB();
const result = await queryDocs("entrypoint block");
console.log(result);
