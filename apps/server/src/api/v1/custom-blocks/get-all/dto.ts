import z from "zod";

export const requestQuerySchema = z.object({
  projectId: z.string(),
});

export const responseSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    name: z.string(),
    icon: z.string().optional().nullable(),
    iconUrl: z.string().optional().nullable(),
    inputType: z.any().optional().nullable(),
  })
);
