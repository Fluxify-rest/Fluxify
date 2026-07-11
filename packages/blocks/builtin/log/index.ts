import z from "zod";
import { baseBlockDataSchema, Context } from "../../baseBlock";

export const logBlockSchema = z
	.object({
		message: z.string().optional().describe("string message to log"),
		level: z
			.enum(["info", "warn", "error"])
			.default("info")
			.describe("log level"),
	})
	.extend(baseBlockDataSchema.shape);

export async function formatMessage(
	originalMsg: any,
	level: string,
	context: Context,
	params?: any,
	type: "str" | "obj" = "str",
) {
	let evaluatedMsg = originalMsg;
	if (typeof originalMsg === "string" && originalMsg.startsWith("js:")) {
		evaluatedMsg = await context.vm.runAsync(originalMsg.slice(3), params);
	}

	if (type === "obj") {
		return evaluatedMsg;
	}

	const isObject = typeof evaluatedMsg == "object" && evaluatedMsg !== null;
	const datetime = new Date().toISOString().split("T");
	const date = datetime[0];
	const time = datetime[1].substring(0, datetime[1].lastIndexOf("."));
	const path = context.route;
	const msg = `${level.toUpperCase()}-${path}-${date} ${time}\n${
		isObject ? JSON.stringify(evaluatedMsg, null, 2) : evaluatedMsg
	}`;
	return msg;
}
