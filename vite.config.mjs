import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteImagemin from 'vite-plugin-imagemin'


const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				// catalog: "catalog.html",
				// about: "about.html",
				// blog: "blog.html",
			},
		},
	},
	plugins: [
		viteImagemin({
		  gifsicle: {
			optimizationLevel: 7,
			interlaced: false,
		  },
		  optipng: {
			optimizationLevel: 7,
		  },
		  mozjpeg: {
			quality: 20,
		  },
		  pngquant: {
			quality: [0.8, 0.9],
			speed: 4,
		  },
		  svgo: {
			plugins: [
			  {
				name: 'removeViewBox',
			  },
			  {
				name: 'removeEmptyAttrs',
				active: false,
			  },
			],
		  },
		}),
	  ],
});
