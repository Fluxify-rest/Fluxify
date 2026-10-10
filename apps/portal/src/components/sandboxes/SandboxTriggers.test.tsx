import { afterAll, afterEach, expect, mock, spyOn, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// DOM only for this file; RTL reads `document` on import, so load it after.
GlobalRegistrator.register();

const { act, cleanup, fireEvent, render, within } = await import("@testing-library/react");
/** Not RTL's waitFor/screen: they stay bound to the DOM of whichever test file loaded RTL first. */
async function until<T>(check: () => T, timeout = 1500): Promise<T> {
	const end = Date.now() + timeout;
	for (;;) {
		try {
			return check();
		} catch (e) {
			if (Date.now() > end) throw e;
			await act(() => new Promise((r) => setTimeout(r, 20)));
		}
	}
}
const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");
const { triggersService } = await import("@/services/triggers");
const { SandboxTriggersModal } = await import("./SandboxTriggersModal");

afterEach(() => {
	cleanup();
	mock.restore();
});
afterAll(() => GlobalRegistrator.unregister());

const row = (over: Record<string, unknown>) =>
	({
		id: "t",
		name: "t",
		type: "redis",
		active: true,
		workflowId: null,
		sandboxId: null,
		workflow: null,
		disabledReason: null,
		schedule: null,
		timezone: "UTC",
		...over,
	}) as never;

const attached = row({ id: "t1", name: "orders stream", sandboxId: "s1" });
const free = row({ id: "t2", name: "spare queue" });
const nightly = row({ id: "t3", name: "nightly", type: "schedule", schedule: "@daily" });
const busy = row({ id: "t4", name: "taken", workflowId: "w1" });

function mockList() {
	return spyOn(triggersService, "getAll").mockImplementation(async (query) => ({
		data: query.sandboxId ? [attached] : [attached, free, nightly, busy],
		pagination: { page: 1, totalPages: 1, hasNext: false },
	}));
}

const mount = (readOnly = false) =>
	render(
		<QueryClientProvider
			client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
		>
			<SandboxTriggersModal
				projectId="p1"
				sandboxId="s1"
				readOnly={readOnly}
				isOpen
				onOpenChange={() => {}}
			/>
		</QueryClientProvider>,
	);

const button = (name: string) =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent?.trim() === name) as
		| HTMLButtonElement
		| undefined;

test("lists the sandbox's triggers, asked for by sandbox id", async () => {
	const list = mockList();
	mount();
	await until(() => expect(document.body.textContent).toContain("orders stream"));
	expect(list).toHaveBeenCalledWith({ projectId: "p1", sandboxId: "s1" });
	expect(document.body.textContent).toContain("development worker");
});

test("offers only unattached triggers that can run a sandbox, and attaches by patching sandboxId", async () => {
	mockList();
	const update = spyOn(triggersService, "update").mockResolvedValue({} as never);
	mount();
	const select = await until(() => {
		const el = document.body.querySelector("select");
		if (!el || el.options.length < 2) throw new Error("no options yet");
		return el;
	});
	const offered = [...select.options].map((o) => o.value).filter(Boolean);
	expect(offered).toEqual(["t2"]);

	fireEvent.change(select, { target: { value: "t2" } });
	await until(() => expect(button("Attach")?.hasAttribute("disabled")).toBe(false));
	fireEvent.click(button("Attach") as HTMLButtonElement);
	await until(() => expect(update).toHaveBeenCalledWith("t2", { sandboxId: "s1" }));
});

test("detaching patches sandboxId to null after a confirm", async () => {
	mockList();
	const update = spyOn(triggersService, "update").mockResolvedValue({} as never);
	mount();
	await until(() => expect(button("Detach")).toBeDefined());
	fireEvent.click(button("Detach") as HTMLButtonElement);
	const dialog = await until(() => {
		const found = [...document.body.querySelectorAll("[role=dialog]")].find((d) =>
			d.textContent?.includes("Detach trigger?"),
		);
		if (!found) throw new Error("no confirm");
		return found as HTMLElement;
	});
	expect(dialog.textContent).toContain("running this sandbox");
	fireEvent.click(within(dialog).getByRole("button", { name: "Detach" }));
	await until(() => expect(update).toHaveBeenCalledWith("t1", { sandboxId: null }));
});

test("read-only: no attach and no detach", async () => {
	mockList();
	mount(true);
	await until(() => expect(document.body.textContent).toContain("orders stream"));
	expect(button("Attach")).toBeUndefined();
	expect(button("Detach")).toBeUndefined();
});
