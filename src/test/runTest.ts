import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..", "..");

  await runTests({
    extensionDevelopmentPath: projectRoot,
    extensionTestsPath: path.resolve(__dirname, "suite"),
    // ワークスペースを固定し、他拡張を無効化
    launchArgs: [
      path.resolve(projectRoot, "test-fixtures"),
      "--disable-extensions",
    ],
  });
}

main().catch((err) => {
  console.error("Failed to run tests\n", err);
  process.exit(1);
});
