import { requestBodySchema, responseSchema } from "./dto";
import { z } from "zod";
import { auth } from "../../../lib/auth";
import { getSetting } from "../../../loaders/instanceSettingsLoader";
import { ValidationError } from "../../../errors/validationError";
import { addAllowlistEmail } from "../../v1/sso-allowlist/repository";

export default async function handleRequest(
  data: z.infer<typeof requestBodySchema>
): Promise<z.infer<typeof responseSchema>> {
  const mode = getSetting("auth_config")?.mode ?? "traditional";

  if (mode === "sso_only") {
    // Auth is offloaded to the IdP. We don't create a user row — SSO login
    // JIT-creates it. We only allowlist the email (domain-checked); the JIT
    // create.before hook lets that email through, everyone else is rejected.
    const sso = getSetting("sso_config");
    if (!sso) {
      throw new ValidationError([
        { field: "email", message: "SSO is not configured" },
      ]);
    }
    const domain = data.email.split("@")[1]?.toLowerCase();
    if (domain !== sso.domain.toLowerCase()) {
      throw new ValidationError([
        { field: "email", message: `Email must be on the ${sso.domain} domain` },
      ]);
    }
    const row = await addAllowlistEmail(data.email);
    return { id: row.id };
  }

  // traditional: email + password required
  if (!data.password) {
    throw new ValidationError([
      { field: "password", message: "Password is required" },
    ]);
  }
  const result = await auth.api.createUser({
    body: {
      email: data.email,
      name: data.fullname || "",
      password: data.password,
      data: {
        isSystemAdmin: data.isSystemAdmin,
      },
    },
  });
  return {
    id: result.user.id,
  };
}
