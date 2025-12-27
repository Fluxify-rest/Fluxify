import { requestBodySchema, responseSchema } from "./dto";
import { z } from "zod";
import { auth } from "../../../lib/auth";

export default async function handleRequest(
  data: z.infer<typeof requestBodySchema>
): Promise<z.infer<typeof responseSchema>> {
  const result = await auth.api.createUser({
    body: {
      email: data.email,
      name: data.fullname || "",
      password: data.password!,
      data: {
        isSystemAdmin: data.isSystemAdmin,
      },
    },
  });
  return {
    id: result.user.id,
  };
}
