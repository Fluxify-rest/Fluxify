import { afterAll, afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// DOM only for this file; RTL reads `document` on import, so load it after.
GlobalRegistrator.register({ url: "http://localhost:5601/" });

const { act, cleanup, fireEvent, render } = await import("@testing-library/react");
const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");
const { EphemeralRunSettings } = await import("./EphemeralRunSettings");
const { projectSettingsKeysService } = await import("@/services/projectSettingsKeys");
const { authStore } = await import("@/store/auth");

const upsert = spyOn(projectSettingsKeysService, "upsert");

beforeEach(() => upsert.mockReset().mockResolvedValue({} as never));
afterEach(cleanup);
afterAll(() => GlobalRegistrator.unregister());

function setup(role: "viewer" | "creator", settings: Record<string, string> = {}) {
	authStore
		.getState()
		.actions.setUserData({ id: "u1", name: "U", email: "u@x.io", isSystemAdmin: false });
	authStore.getState().actions.setACL([{ projectId: "p1", role }]);
	render(
		<QueryClientProvider client={new QueryClient()}>
			<EphemeralRunSettings projectId="p1" settings={settings} />
		</QueryClientProvider>,
	);
}

const tick = () => act(() => new Promise((r) => setTimeout(r, 30)));
const checkbox = () => document.querySelector<HTMLInputElement>("input[type=checkbox]")!;
const timeoutInput = () =>
	document.querySelector<HTMLInputElement>("input[type=text], input:not([type=checkbox])")!;

test("shows the saved timeout, 10 when none, and the ask setting", () => {
	setup("creator", {
		"settings.ai.ephemeralRunTimeoutSeconds": "25",
		"settings.ai.askBeforeEphemeralRuns": "true",
	});
	expect(timeoutInput().value).toBe("25");
	expect(checkbox().checked).toBe(true);
	expect(document.body.textContent).toContain("Ask before ephemeral runs");
});

test("defaults to 10 seconds and not asking", () => {
	setup("creator");
	expect(timeoutInput().value).toBe("10");
	expect(checkbox().checked).toBe(false);
});

test("ticking the box saves askBeforeEphemeralRuns at once", async () => {
	setup("creator");
	await act(async () => void fireEvent.click(checkbox()));
	await tick();
	expect(upsert).toHaveBeenCalledWith("p1", {
		key: "settings.ai.askBeforeEphemeralRuns",
		value: "true",
	});
});

test("a changed timeout is saved with Save, as a string inside 1-30", async () => {
	setup("creator");
	await act(async () => {
		fireEvent.change(timeoutInput(), { target: { value: "20" } });
		fireEvent.blur(timeoutInput());
	});
	const save = [...document.querySelectorAll("button")].find((b) => b.textContent === "Save")!;
	await act(async () => void fireEvent.click(save));
	await tick();
	expect(upsert).toHaveBeenCalledWith("p1", {
		key: "settings.ai.ephemeralRunTimeoutSeconds",
		value: "20",
	});
});

test("a viewer can read both but not change them", () => {
	setup("viewer");
	expect(checkbox().disabled).toBe(true);
	expect(timeoutInput().disabled).toBe(true);
	expect(document.body.textContent).toContain("Only a creator can change these.");
});
