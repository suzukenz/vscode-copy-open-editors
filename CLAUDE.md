# 対象ファイル

- **IMPORTANT**: 以下のファイルは成果物ファイル等なので、Readしないこと。
  - `out/`

# Bash commands

- `pnpm run compile`: TypeScriptのコンパイルを実行する
- `pnpm run lint`: コードスタイルのチェックを実行する
- `pnpm run pretest`: テストの前処理を実行する(compile, lint)
- `pnpm run test`: テストを実行する

# Workflow

- コード変更後は必ず `pnpm run lint` でコードスタイルをチェックする

# Testing

- VS Code拡張機能のテストは標準出力エラーが多めに出るので、テスト結果を最後まで確認してから、成功か失敗かを判断すること。
