import * as vscode from "vscode";
import path from "node:path";

export function activate(context: vscode.ExtensionContext) {
  console.log("OpenEditors QuickCopy is now active");

  const disposable = vscode.commands.registerCommand(
    "copyOpenEditors.copy",
    async () => {
      try {
        // 開いているタブを取得
        const tabs = vscode.window.tabGroups.all.flatMap((group) => group.tabs);

        // 開いているタブがない場合は警告を表示
        if (tabs.length === 0) {
          vscode.window.showWarningMessage("No open tabs to copy.");
          return;
        }

        // 相対パスに変換
        const pathMap = new Map<string, vscode.TabInputText[]>();

        // 同じ相対パスを持つファイルをグループ化
        tabs
          .filter((tab) => tab.input instanceof vscode.TabInputText)
          .forEach((tab) => {
            const input = tab.input as vscode.TabInputText;
            const filePath = input.uri.fsPath;
            const relativePath = getRelativePath(filePath);
            
            if (!pathMap.has(relativePath)) {
              pathMap.set(relativePath, []);
            }
            pathMap.get(relativePath)?.push(input);
          });
          
        // QuickPickItem に変換
        const editorItems: vscode.QuickPickItem[] = Array.from(pathMap.entries())
          .map(([relativePath, inputs]) => {
            // 同じパスのファイルが複数ある場合は詳細情報にファイル数を表示
            const document = inputs.length > 0 
              ? vscode.workspace.textDocuments.find(
                  (doc) => doc.uri.toString() === inputs[0].uri.toString()
                )
              : undefined;
            const languageId = document?.languageId || "unknown";
            const description = inputs.length > 1 
              ? `${languageId} (${inputs.length} files)`
              : languageId;
            
            return {
              label: relativePath,
              description: description,
              picked: true,
            };
          });

        // QuickPickを作成
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = "Select Open Tabs to Copy (default: all selected)";
        quickPick.items = editorItems;
        quickPick.canSelectMany = true;
        quickPick.selectedItems = editorItems;

        // QuickPickの選択が完了した時の処理
        quickPick.onDidAccept(() => {
          const selectedPaths = quickPick.selectedItems.map(
            (item) => item.label
          );

          if (selectedPaths.length > 0) {
            // クリップボードにコピー
            vscode.env.clipboard
              .writeText(selectedPaths.join("\n"))
              .then(() => {
                vscode.window.showInformationMessage(
                  `Copied ${selectedPaths.length} open tab paths to clipboard.`
                );
              });
          }

          quickPick.hide();
        });

        // QuickPickを表示
        quickPick.show();
      } catch (error) {
        console.error("OpenEditors QuickCopy error:", error);
        vscode.window.showErrorMessage(`Error copying tab paths: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

/**
 * ファイルの絶対パスをワークスペースからの相対パスに変換する
 * @param filePath 変換対象のファイルパス
 * @returns ワークスペースからの相対パス（ワークスペースが存在しない場合は元のパスをそのまま返す）
 */
function getRelativePath(filePath: string): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  return workspaceFolder
    ? path.relative(workspaceFolder.uri.fsPath, filePath)
    : filePath;
}
