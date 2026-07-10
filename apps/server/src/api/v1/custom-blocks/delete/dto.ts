import { z } from "zod";
export const requestParamSchema = z.object({ id: z.string() });
export const responseSchema = z.object({ id: z.string() });
