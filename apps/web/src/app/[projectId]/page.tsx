import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

export default async function Page(params: any) {
	const { projectId } = await params.params;
	redirect(APP_ROUTES.PROJECT_ROUTES(projectId));
}
