import * as vscode from "vscode";
import { provideCompletionItems } from "./provideCompletionItems";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(
    "Cursor LLM Autocomplete"
  );

  const triggerCompletion = vscode.commands.registerCommand(
    "cursor-llm-autocomplete.triggerCompletion",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor");
        return;
      }

      const document = editor.document;
      const position = editor.selection.active;
      const supportedLanguages = ["python", "javascript", "typescript"];
      if (!supportedLanguages.includes(document.languageId)) {
        vscode.window.showErrorMessage(
          "Language not supported for LLM autocomplete"
        );
        return;
      }

      try {
        const completionItems = await provideCompletionItems(
          document,
          position
        );
        if (completionItems && completionItems.length > 0) {
          await editor.insertSnippet(
            (completionItems[0].insertText as vscode.SnippetString) ||
              new vscode.SnippetString(completionItems[0].label.toString()),
            position
          );
        } else {
          vscode.window.showInformationMessage("No completions available");
        }
      } catch (error) {
        outputChannel.appendLine(`Error: ${error}`);
        vscode.window.showErrorMessage("Failed to fetch LLM completion.");
      }
    }
  );

  context.subscriptions.push(triggerCompletion, outputChannel);
}

export function deactivate() {}
