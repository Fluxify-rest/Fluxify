import { Button, ListBox, SearchField, Select, Spinner } from "@fluxify/components";
import { useMemo, useState } from "react";
import { TbArrowLeft, TbChevronLeft, TbChevronRight } from "react-icons/tb";

export type SwitcherItem = {
	id: string;
	/** What the trigger and the list row render. */
	label: React.ReactNode;
	/** Plain text for type-ahead, since `label` is markup. */
	textValue: string;
};

const PAGE_SIZE = 5;

/**
 * Canvas header nav: back to the list this thing belongs to, plus a stepper and
 * a dropdown over its siblings.
 *
 * Routes, custom blocks and workflows all sit on the same canvas, so they all
 * need the same header. It used to be one copy per entity, which is how a third
 * copy would have arrived with workflows.
 */
export function EntitySwitcher({
	backLabel,
	noun,
	items,
	currentId,
	isLoading,
	hasMore,
	onBack,
	onSelect,
}: {
	backLabel: string;
	/** Names the controls for screen readers — "route", "workflow". */
	noun: string;
	items: SwitcherItem[];
	currentId: string;
	isLoading?: boolean;
	/** More siblings exist than were fetched, so the counter says "of 50+". */
	hasMore?: boolean;
	onBack: () => void;
	onSelect: (id: string) => void;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);

	const index = items.findIndex((item) => item.id === currentId);
	const current = index >= 0 ? items[index] : undefined;

	function step(delta: number) {
		const next = items[index + delta];
		if (next) onSelect(next.id);
	}

	const filteredItems = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return items;
		return items.filter((item) => item.textValue.toLowerCase().includes(q));
	}, [items, searchQuery]);

	const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
	const safePage = Math.min(Math.max(1, page), totalPages);

	const paginatedItems = useMemo(() => {
		const start = (safePage - 1) * PAGE_SIZE;
		return filteredItems.slice(start, start + PAGE_SIZE);
	}, [filteredItems, safePage]);

	function handleOpenChange(isOpen: boolean) {
		if (isOpen) {
			setSearchQuery("");
			const currentIdx = items.findIndex((item) => item.id === currentId);
			setPage(currentIdx >= 0 ? Math.floor(currentIdx / PAGE_SIZE) + 1 : 1);
		}
	}

	return (
		<div className="flex min-w-0 items-center gap-2">
			<Button variant="ghost" size="sm" aria-label={`Back to ${backLabel}`} onPress={onBack}>
				<TbArrowLeft size={16} /> {backLabel}
			</Button>

			<span className="h-5 w-px bg-border" />

			{isLoading ? (
				<Spinner size="sm" />
			) : (
				<div className="flex min-w-0 items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						aria-label={`Previous ${noun}`}
						isDisabled={index <= 0}
						onPress={() => step(-1)}
					>
						<TbChevronLeft size={16} />
					</Button>

					<Select
						aria-label={`Switch ${noun}`}
						selectedKey={current?.id ?? null}
						onSelectionChange={(key) => key && onSelect(key as string)}
						onOpenChange={handleOpenChange}
						className="min-w-0"
					>
						<Select.Trigger className="min-w-0 max-w-[22rem]">
							{current?.label ?? (
								<span className="truncate text-xs text-muted">Unknown {noun}</span>
							)}
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover className="w-[26rem]">
							<div className="border-b border-border p-2">
								<SearchField
									aria-label={`Search ${noun}s`}
									value={searchQuery}
									onChange={(val) => {
										setSearchQuery(val);
										setPage(1);
									}}
									variant="secondary"
									className="w-full"
								>
									<SearchField.Group className="w-full">
										<SearchField.SearchIcon />
										<SearchField.Input
											placeholder={`Search ${noun}s...`}
											autoFocus
											onKeyDown={(e) => {
												if (e.key === "ArrowDown") {
													e.preventDefault();
													const popover = e.currentTarget.closest("[data-slot=select-popover]");
													const first = popover?.querySelector<HTMLElement>("[role=option]");
													first?.focus();
												}
											}}
										/>
										<SearchField.ClearButton />
									</SearchField.Group>
								</SearchField>
							</div>

							<ListBox
								renderEmptyState={() => (
									<div className="py-6 text-center text-xs text-muted">No {noun}s found</div>
								)}
							>
								{paginatedItems.map((item) => (
									<ListBox.Item key={item.id} id={item.id} textValue={item.textValue}>
										{item.label}
										<ListBox.ItemIndicator />
									</ListBox.Item>
								))}
							</ListBox>

							<div className="flex items-center justify-between border-t border-border px-2 py-1.5 text-xs text-muted">
								<Button
									variant="ghost"
									size="sm"
									aria-label={`Previous ${noun}s page`}
									isDisabled={safePage <= 1}
									onPress={() => setPage((p) => Math.max(1, p - 1))}
									className="h-7 px-2"
								>
									<TbChevronLeft size={16} />
								</Button>
								<span className="text-xs text-muted">
									Page {safePage} of {totalPages}
								</span>
								<Button
									variant="ghost"
									size="sm"
									aria-label={`Next ${noun}s page`}
									isDisabled={safePage >= totalPages}
									onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
									className="h-7 px-2"
								>
									<TbChevronRight size={16} />
								</Button>
							</div>
						</Select.Popover>
					</Select>

					<Button
						variant="ghost"
						size="sm"
						aria-label={`Next ${noun}`}
						isDisabled={index < 0 || index >= items.length - 1}
						onPress={() => step(1)}
					>
						<TbChevronRight size={16} />
					</Button>

					{index >= 0 && (
						<span className="ml-1 whitespace-nowrap text-xs text-muted">
							{index + 1} / {items.length}
							{hasMore && "+"}
						</span>
					)}
				</div>
			)}
		</div>
	);
}
