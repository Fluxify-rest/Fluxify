import {
  aiVariantSchema,
  baasVariantSchema,
  databaseVariantSchema,
  kvVariantSchema,
} from "@fluxify/server/src/api/v1/integrations/schemas";
import React from "react";
import { BiLogoPostgresql } from "react-icons/bi";
import { DiMongodb, DiRedis } from "react-icons/di";
import { SiAnthropic, SiMysql, SiOpenai } from "react-icons/si";
import z from "zod";
import MemcachedIcon from "./icons/memcached";
import { TbBrandFirebase, TbBrandSupabase } from "react-icons/tb";
import { RiOpenaiLine } from "react-icons/ri";

export type IntegrationVariants =
  | z.infer<typeof databaseVariantSchema>
  | z.infer<typeof kvVariantSchema>
  | z.infer<typeof aiVariantSchema>
  | z.infer<typeof baasVariantSchema>;

type IntegrationIcons = Record<IntegrationVariants, React.ReactNode>;

const iconSize = 20;
const iconStyles: React.CSSProperties = {};
export const integrationIcons: IntegrationIcons = {
  PostgreSQL: <BiLogoPostgresql size={iconSize} style={iconStyles} />,
  MongoDB: <DiMongodb size={iconSize} style={iconStyles} />,
  MySQL: <SiMysql size={iconSize} style={iconStyles} />,
  Redis: <DiRedis size={iconSize} style={iconStyles} />,
  Memcached: <MemcachedIcon />,
  Supabase: <TbBrandSupabase size={iconSize} style={iconStyles} />,
  Firebase: <TbBrandFirebase size={iconSize} style={iconStyles} />,
  "OpenAI Compatible": <RiOpenaiLine size={iconSize} style={iconStyles} />,
  Anthropic: <SiAnthropic size={iconSize} style={iconStyles} />,
  OpenAI: <SiOpenai size={iconSize} style={iconStyles} />,
};
