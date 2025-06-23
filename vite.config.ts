import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		host: "0.0.0.0",
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173,
			clientPort: 443,
		},
		allowedHosts: [
			"a83c704e-e1bb-44dd-9651-282d936965e8-00-2uv2hmbbnucrk.sisko.replit.dev", "2e08ac72-e7fa-4f28-877b-3fe9b9186f68-00-3kt1b1ef55r94.sisko.replit.dev",
			"u-lms.replit.app",
			"all",
		],
	},
	preview: {
		host: "0.0.0.0",
		port: 5173,
		strictPort: true,
	},
});
