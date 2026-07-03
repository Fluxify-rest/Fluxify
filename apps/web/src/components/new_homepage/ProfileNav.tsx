"use client";
import React from "react";
import { Avatar, Menu, Modal, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { TbLogout, TbUser } from "react-icons/tb";
import { authClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccountDetails from "../settings/accountDetails";

const ProfileNav = () => {
	const session = authClient.useSession();
	const [opened, { open, close }] = useDisclosure(false);

	if (!session.data?.user) {
		return null;
	}

	const logout = async () => {
		await authClient.signOut();
		redirect("/login");
	};

	const username = session.data.user.name?.substring(0, 2).toUpperCase() || "U";

	return (
		<>
			<Menu shadow="md" width={200} position="bottom-end">
				<Menu.Target>
					<UnstyledButton>
						<Avatar
							color="violet"
							src={session.data?.user.image}
							radius="xl"
							size="md"
						>
							{session.data?.user.image ? null : username}
						</Avatar>
					</UnstyledButton>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Item leftSection={<TbUser size={20} />} onClick={open}>
						Profile
					</Menu.Item>
					<Menu.Item
						leftSection={<TbLogout size={20} />}
						color="red"
						onClick={logout}
					>
						Logout
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>

			<Modal
				opened={opened}
				onClose={close}
				title={<Text fw={500}>Account Details</Text>}
				centered
				size="xl"
			>
				<AccountDetails />
			</Modal>
		</>
	);
};

export default ProfileNav;
