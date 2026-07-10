import { z } from "zod";

export const requestParamSchema = z.object({
  id: z.string(),
});

const changeSchema = z.object({
  id: z.string(),
  action: z.enum(["upsert", "delete"]),
});

export const requestBodySchema = z.object({
  actionsToPerform: z.object({
    blocks: z.array(changeSchema),
    edges: z.array(changeSchema),
  }),
  changes: z.object({
    blocks: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        data: z.any(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      })
    ),
    edges: z.array(
      z.object({
        id: z.string(),
        from: z.string(),
        to: z.string(),
        fromHandle: z.string().nullable().optional(),
        toHandle: z.string().nullable().optional(),
      })
    ),
  }),
});
