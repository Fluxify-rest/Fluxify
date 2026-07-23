import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_authed/$projectId/app-config")({
	component: () => <ComingSoon title="App config" />,
});
