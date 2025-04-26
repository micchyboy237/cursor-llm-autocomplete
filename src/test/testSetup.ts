import { resolve } from "path";
import { existsSync, unlinkSync } from "fs";
import { homedir } from "os";

export function cleanTestEnvironment() {
  // Clean up potential VSCode test socket files
  // const sockPattern = resolve(homedir(), ".vscode-test/user-data/*.sock");
  const sockPattern = resolve(homedir(), ".vscode-test/user-data/*.sock");
  const glob = require("glob");
  const sockFiles = glob.sync(sockPattern);

  for (const sockFile of sockFiles) {
    if (existsSync(sockFile)) {
      try {
        unlinkSync(sockFile);
      } catch (err) {
        console.warn(`Failed to clean socket file ${sockFile}:`, err);
      }
    }
  }
}

// export function cleanTestEnvironment() {
//   const sockPath = resolve(
//     __dirname,
//     "../../.vscode-test/user-data/1.99-main.sock"
//   );
//   if (existsSync(sockPath)) {
//     try {
//       unlinkSync(sockPath);
//     } catch (err) {
//       console.warn("Failed to clean socket file:", err);
//     }
//   }
// }
