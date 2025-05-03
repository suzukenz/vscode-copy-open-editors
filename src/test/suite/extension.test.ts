import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import * as path from "path";

suite("OpenEditors QuickCopy", () => {
  const workspace = path.resolve(__dirname, "../../../src/test/fixtures");

  let quickPickStub: sinon.SinonStub;
  let fakeQuickPick: {
    title: string;
    items: vscode.QuickPickItem[];
    canSelectMany: boolean;
    selectedItems: vscode.QuickPickItem[];
    show(): void;
    hide(): void;
    onDidAccept(cb: () => void): { dispose(): void };
  };

  setup(() => {
    sinon
      .stub(vscode.workspace, "workspaceFolders")
      .value([{ uri: vscode.Uri.file(workspace) }]);

    // fake QuickPick の用意
    fakeQuickPick = {
      title: "",
      items: [],
      canSelectMany: true,
      selectedItems: [],
      show: () => {},
      hide: () => {},
      onDidAccept: (cb: () => void) => {
        // 次のイベントループで即座に accept を呼び出す
        setImmediate(cb);
        return { dispose: () => {} };
      },
    };

    // createQuickPick を上書き
    quickPickStub = sinon
      .stub(vscode.window, "createQuickPick")
      .returns(fakeQuickPick as any);
  });

  teardown(async () => {
    sinon.restore();
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await vscode.env.clipboard.writeText("");
  });

  test("開いているタブの相対パスをクリップボードへコピーできる", async () => {
    // テスト用ファイルを 2 枚開く
    const uris = ["foo.ts", "bar.js"].map((f) =>
      vscode.Uri.file(path.join(workspace, f))
    );
    for (const uri of uris) {
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: false });
    }

    // コマンド実行
    await vscode.commands.executeCommand("copyOpenEditors.copy");

    // onDidAccept が setImmediate で呼び出されるまで待つ
    await new Promise((r) => setImmediate(r));

    // クリップボード検証
    const clip = await vscode.env.clipboard.readText();
    const lines = clip.split(/\r?\n/);

    assert.strictEqual(lines[0], "foo.ts");
    assert.strictEqual(lines[1], "bar.js");
  });

  test("タブが 0 枚の時は警告を出し、クリップボードを変更しない", async () => {
    const warnStub = sinon.stub(vscode.window, "showWarningMessage");

    // エディタを全閉
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await vscode.env.clipboard.writeText("initial");

    await vscode.commands.executeCommand("copyOpenEditors.copy");

    // こちらは QuickPick を生成せず警告ルートを通るため stub は不要
    assert.ok(warnStub.calledOnceWith("No open tabs to copy."));
    assert.strictEqual(await vscode.env.clipboard.readText(), "initial");
  });
});
