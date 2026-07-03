"use client";
import React from "react";
import { Group, Image } from "@mantine/core";
import ProfileNav from "./ProfileNav";

const Header = () => {
  return (
    <Group justify="space-between" align="center" px="xl" py="md" w="100%" wrap="nowrap">
      {/* Empty element for flexbox spacing to keep logo centered */}
      <div style={{ width: 40 }} />
      
      <Image
        src="/_/admin/ui/logo_title.webp"
        alt="Fluxify Logo"
        height={40}
        w="auto"
        fit="contain"
      />
      
      <ProfileNav />
    </Group>
  );
};

export default Header;
