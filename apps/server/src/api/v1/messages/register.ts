import getByRouteId from "./get-by-route-id/route";
import getStatus from "./get-status/route";
import postMessage from "./post-message/route";
import clearMessages from "./clear-messages/route";
import { HonoServer } from "../../../types";

export default {
	registerHandler(app: HonoServer) {
		const router = app.basePath("/messages");
		getByRouteId(router);
		getStatus(router);
		postMessage(router);
		clearMessages(router);
	},
};
