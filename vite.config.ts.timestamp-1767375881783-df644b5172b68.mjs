// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import electron from "file:///home/project/node_modules/vite-plugin-electron/dist/index.mjs";
import renderer from "file:///home/project/node_modules/vite-plugin-electron-renderer/dist/index.mjs";
var vite_config_default = defineConfig(({ command, mode }) => {
  const isElectron = process.env.ELECTRON === "true";
  return {
    plugins: [
      react(),
      ...isElectron ? [
        electron([
          {
            entry: "electron/main.js"
          },
          {
            entry: "electron/preload.js",
            onstart(options) {
              options.reload();
            }
          }
        ]),
        renderer()
      ] : []
    ],
    optimizeDeps: {
      exclude: ["lucide-react"]
    },
    base: isElectron ? "./" : "/"
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgZWxlY3Ryb24gZnJvbSAndml0ZS1wbHVnaW4tZWxlY3Ryb24nO1xuaW1wb3J0IHJlbmRlcmVyIGZyb20gJ3ZpdGUtcGx1Z2luLWVsZWN0cm9uLXJlbmRlcmVyJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pID0+IHtcbiAgY29uc3QgaXNFbGVjdHJvbiA9IHByb2Nlc3MuZW52LkVMRUNUUk9OID09PSAndHJ1ZSc7XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgLi4uKGlzRWxlY3Ryb24gPyBbXG4gICAgICAgIGVsZWN0cm9uKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBlbnRyeTogJ2VsZWN0cm9uL21haW4uanMnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZW50cnk6ICdlbGVjdHJvbi9wcmVsb2FkLmpzJyxcbiAgICAgICAgICAgIG9uc3RhcnQob3B0aW9ucykge1xuICAgICAgICAgICAgICBvcHRpb25zLnJlbG9hZCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdKSxcbiAgICAgICAgcmVuZGVyZXIoKSxcbiAgICAgIF0gOiBbXSksXG4gICAgXSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgfSxcbiAgICBiYXNlOiBpc0VsZWN0cm9uID8gJy4vJyA6ICcvJyxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sY0FBYztBQUdyQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFNBQVMsS0FBSyxNQUFNO0FBQ2pELFFBQU0sYUFBYSxRQUFRLElBQUksYUFBYTtBQUU1QyxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixHQUFJLGFBQWE7QUFBQSxRQUNmLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxPQUFPO0FBQUEsVUFDVDtBQUFBLFVBQ0E7QUFBQSxZQUNFLE9BQU87QUFBQSxZQUNQLFFBQVEsU0FBUztBQUNmLHNCQUFRLE9BQU87QUFBQSxZQUNqQjtBQUFBLFVBQ0Y7QUFBQSxRQUNGLENBQUM7QUFBQSxRQUNELFNBQVM7QUFBQSxNQUNYLElBQUksQ0FBQztBQUFBLElBQ1A7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsSUFDMUI7QUFBQSxJQUNBLE1BQU0sYUFBYSxPQUFPO0FBQUEsRUFDNUI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
