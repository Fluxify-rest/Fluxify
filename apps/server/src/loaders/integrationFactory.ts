import z from "zod";
import {
  integrationsGroupSchema,
  observabilityVariantSchema,
} from "../api/v1/integrations/schemas";
import { observabilityIntegrationsCache } from "./integrationsLoader";
import { OpenObserve } from "@fluxify/adapters";

export function createIntegrationObject(options: {
  integrationId: string;
  type: string;
  path: {
    routeId: string;
    projectId: string;
    projectName: string;
  };
}) {
  switch (options.type as z.infer<typeof integrationsGroupSchema>) {
    case "database":
      break;
    case "kv":
      break;
    case "ai":
      break;
    case "baas":
      break;
    case "observability":
      return createObservibilityIntegration(
        observabilityIntegrationsCache[options.integrationId],
        options.path,
      );
  }
}

function createObservibilityIntegration(
  data: any,
  path: {
    routeId: string;
    projectId: string;
    projectName: string;
  },
) {
  const type = data.variant;
  switch (type as z.infer<typeof observabilityVariantSchema>) {
    case "Open Observe":
      return new OpenObserve({
        ...data,
        projectId: path.projectName,
        routeId: path.routeId,
      });
  }
}
