import { isMainThread } from "worker_threads";
import { runMain } from "./main";
import { runWorker } from "./worker";

if (isMainThread) {
	await runMain();
} else {
	await runWorker();
}
