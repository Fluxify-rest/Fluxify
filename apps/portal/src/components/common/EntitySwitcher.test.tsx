import { afterAll, afterEach, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
Element.prototype.scrollIntoView = () => {};

const { cleanup, fireEvent, render, within } = await import("@testing-library/react");
const { EntitySwitcher } = await import("./EntitySwitcher");

afterEach(cleanup);
afterAll(() => GlobalRegistrator.unregister());

const sampleItems = Array.from({ length: 12 }, (_, i) => ({
	id: `item-${i + 1}`,
	textValue: `Route ${i + 1} /path/${i + 1}`,
	label: <span>Route {i + 1}</span>,
}));

test("renders back button, step controls, and current counter", () => {
	const onBack = mock();
	const onSelect = mock();
	const { getByRole, getByText } = render(
		<EntitySwitcher
			backLabel="Routes"
			noun="route"
			items={sampleItems}
			currentId="item-1"
			onBack={onBack}
			onSelect={onSelect}
		/>,
	);

	const backButton = getByRole("button", { name: "Back to Routes" });
	fireEvent.click(backButton);
	expect(onBack).toHaveBeenCalled();

	expect(getByText("1 / 12")).toBeDefined();
});

test("paginates items into 5 rows per page and enables navigation", () => {
	const onSelect = mock();
	const { getByRole, getByText } = render(
		<EntitySwitcher
			backLabel="Routes"
			noun="route"
			items={sampleItems}
			currentId="item-1"
			onBack={() => {}}
			onSelect={onSelect}
		/>,
	);

	// Open dropdown
	const trigger = getByRole("button", { name: "Switch route" });
	fireEvent.click(trigger);

	const listbox = getByRole("listbox");

	// Page 1 should show first 5 items
	expect(getByText("Page 1 of 3")).toBeDefined();
	expect(within(listbox).queryByText("Route 1")).toBeDefined();
	expect(within(listbox).queryByText("Route 5")).toBeDefined();
	expect(within(listbox).queryByText("Route 6")).toBeNull();

	const prevPage = getByRole("button", { name: "Previous routes page" });
	const nextPage = getByRole("button", { name: "Next routes page" });

	expect(prevPage.getAttribute("disabled")).not.toBeNull();
	expect(nextPage.getAttribute("disabled")).toBeNull();

	// Move to page 2
	fireEvent.click(nextPage);
	expect(getByText("Page 2 of 3")).toBeDefined();
	expect(within(listbox).queryByText("Route 1")).toBeNull();
	expect(within(listbox).queryByText("Route 6")).toBeDefined();
	expect(within(listbox).queryByText("Route 10")).toBeDefined();
	expect(within(listbox).queryByText("Route 11")).toBeNull();

	// Move to page 3
	fireEvent.click(nextPage);
	expect(getByText("Page 3 of 3")).toBeDefined();
	expect(within(listbox).queryByText("Route 10")).toBeNull();
	expect(within(listbox).queryByText("Route 11")).toBeDefined();
	expect(within(listbox).queryByText("Route 12")).toBeDefined();
	expect(nextPage.getAttribute("disabled")).not.toBeNull();

	// Move back to page 2
	fireEvent.click(prevPage);
	expect(getByText("Page 2 of 3")).toBeDefined();
	expect(within(listbox).queryByText("Route 6")).toBeDefined();
});

test("search works across pages and filters items", () => {
	const onSelect = mock();
	const { getByRole, getByPlaceholderText, getByText, queryByText } = render(
		<EntitySwitcher
			backLabel="Routes"
			noun="route"
			items={sampleItems}
			currentId="item-1"
			onBack={() => {}}
			onSelect={onSelect}
		/>,
	);

	// Open dropdown
	const trigger = getByRole("button", { name: "Switch route" });
	fireEvent.click(trigger);

	const listbox = getByRole("listbox");
	const searchInput = getByPlaceholderText("Search routes...");

	// Search for an item on page 2 (e.g. Route 8)
	fireEvent.change(searchInput, { target: { value: "Route 8" } });

	expect(within(listbox).queryByText("Route 8")).toBeDefined();
	expect(within(listbox).queryByText("Route 1")).toBeNull();
	expect(getByText("Page 1 of 1")).toBeDefined();

	// Search with no matches
	fireEvent.change(searchInput, { target: { value: "nonexistent" } });
	expect(queryByText("No routes found")).toBeDefined();
});

test("selecting an item calls onSelect", () => {
	const onSelect = mock();
	const { getByRole } = render(
		<EntitySwitcher
			backLabel="Routes"
			noun="route"
			items={sampleItems}
			currentId="item-1"
			onBack={() => {}}
			onSelect={onSelect}
		/>,
	);

	const trigger = getByRole("button", { name: "Switch route" });
	fireEvent.click(trigger);

	const listbox = getByRole("listbox");
	const option = within(listbox).getByText("Route 3");
	fireEvent.click(option);

	expect(onSelect).toHaveBeenCalledWith("item-3");
});

test("opens to the page containing the current item", () => {
	const { getByRole, getByText } = render(
		<EntitySwitcher
			backLabel="Routes"
			noun="route"
			items={sampleItems}
			currentId="item-7"
			onBack={() => {}}
			onSelect={() => {}}
		/>,
	);

	const trigger = getByRole("button", { name: "Switch route" });
	fireEvent.click(trigger);

	const listbox = getByRole("listbox");
	// item-7 (index 6) should be on page 2 (items 6-10)
	expect(getByText("Page 2 of 3")).toBeDefined();
	expect(within(listbox).queryByText("Route 7")).toBeDefined();
});

test("ArrowDown from search input moves focus to the first option", () => {
	const { getByRole, getByPlaceholderText } = render(
		<EntitySwitcher
			backLabel="Routes"
			noun="route"
			items={sampleItems}
			currentId="item-1"
			onBack={() => {}}
			onSelect={() => {}}
		/>,
	);

	const trigger = getByRole("button", { name: "Switch route" });
	fireEvent.click(trigger);

	const searchInput = getByPlaceholderText("Search routes...");
	searchInput.focus();

	fireEvent.keyDown(searchInput, { key: "ArrowDown" });
	expect(document.activeElement?.getAttribute("data-key")).toBe("item-1");
});
