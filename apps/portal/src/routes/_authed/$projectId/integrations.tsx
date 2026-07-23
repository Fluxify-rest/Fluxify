import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_authed/$projectId/integrations")({
	component: () => <ComingSoon title="Integrations" />,
});
