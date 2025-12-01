"use client";
import { ActionIcon, Avatar, Group, Menu, Text } from "@mantine/core";
import React from "react";
import { TbDots, TbLogout, TbSettings } from "react-icons/tb";
import { authClient } from "@/lib/auth";
import { redirect } from "next/navigation";

const menuItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: <TbSettings size={20} />,
  },
  {
    title: "Logout",
    url: "logout-btn",
    icon: <TbLogout color="red" size={20} />,
  },
];

const ProfileSection = () => {
  function onMenuItemClick(action: string) {
    if (action === "logout-btn") {
      logout();
    }
  }

  const logout = async () => {
    await authClient.signOut();
    redirect("/login");
  };

  return (
    <Group pt={"xs"} justify="space-between" align="center">
      <Avatar />
      <Text>Account Name</Text>
      <Menu shadow="sm" width={200} position="right-end">
        <Menu.Target>
          <ActionIcon color="dark" variant="subtle">
            <TbDots />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown p={"xs"}>
          {menuItems.map((item) => (
            <Menu.Item
              key={item.title}
              leftSection={item.icon}
              onClick={() => onMenuItemClick(item.url)}
            >
              {item.title}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
};

export default ProfileSection;
