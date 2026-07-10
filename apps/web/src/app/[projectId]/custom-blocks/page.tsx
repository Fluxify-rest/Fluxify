"use client";

import React, { useState } from "react";
import {
	Container,
	Title,
	Paper,
	Group,
	Button,
	TextInput,
} from "@mantine/core";
import CustomBlocksList from "./CustomBlocksList";
import { useParams, useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { TbSearch } from "react-icons/tb";

export default function CustomBlocksPage() {
	const { projectId } = useParams();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<Container size="xl" py="xl">
			<Group justify="space-between" mb="xl">
				<TextInput
					placeholder="Search custom blocks..."
					leftSection={<TbSearch size={16} />}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.currentTarget.value)}
					w={300}
				/>
				<Button
					color="violet"
					onClick={() =>
						router.push(
							APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId as string) + "/create",
						)
					}
				>
					Create New
				</Button>
			</Group>
			<CustomBlocksList
				projectId={projectId as string}
				searchQuery={searchQuery}
			/>
		</Container>
	);
}
