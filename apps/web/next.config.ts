import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",
	basePath: "/_/admin/ui",
	serverExternalPackages: ["winston", "winston-loki", "snappy"],
	transpilePackages: [
		"@fluxify/lib",
		"@fluxify/adapters",
		"@fluxify/blocks",
		"@fluxify/ai-gateway",
	],
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
				dns: false,
				child_process: false,
			};
		}
		return config;
	},
	images: {
		unoptimized: true,
	},
	outputFileTracingExcludes: {
		"*": [
			"sharp",
			"@img/sharp-linux-x64",
			"@img/sharp-linuxmusl-x64",
			"@img/sharp-libvips-linux-x64",
			"@img/sharp-libvips-linuxmusl-x64",
		],
	},
};

export default nextConfig;
