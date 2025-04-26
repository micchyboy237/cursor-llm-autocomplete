import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import axios from "axios";
import { activate } from "../extension";
import { cleanTestEnvironment } from "./testSetup";

suite("Extension Test Suite", () => {
  let axiosStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let outputChannelStub: sinon.SinonStub;
  let context: vscode.ExtensionContext;

  suiteSetup(async () => {
    cleanTestEnvironment();

    // Mock axios.post
    axiosStub = sinon.stub(axios, "post").resolves({
      data: {
        on: (event: string, callback: (chunk: Buffer) => void) => {
          if (event === "data") {
            callback(Buffer.from('{"response": "console.log(42);"}'));
          }
          if (event === "end") {
            callback(Buffer.from(""));
          }
        },
      },
    });

    // Mock VSCode UI interactions
    showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
    showInformationMessageStub = sinon.stub(
      vscode.window,
      "showInformationMessage"
    );

    // Mock output channel
    outputChannelStub = sinon.stub();
    sinon.stub(vscode.window, "createOutputChannel").returns({
      appendLine: outputChannelStub,
      dispose: sinon.stub(),
    } as any);

    // Create a minimal ExtensionContext
    context = {
      subscriptions: [],
      globalState: {
        get: sinon.stub(),
        update: sinon.stub().resolves(),
      } as any,
      asAbsolutePath: (relativePath: string) => relativePath,
      extensionMode: vscode.ExtensionMode.Test,
    } as unknown as vscode.ExtensionContext;

    // Activate the extension
    activate(context);
  });

  suiteTeardown(() => {
    axiosStub.restore();
    showErrorMessageStub.restore();
    showInformationMessageStub.restore();
    (vscode.window.createOutputChannel as sinon.SinonStub).restore();
  });

  setup(() => {
    // Reset stubs before each test
    axiosStub.resetHistory();
    showErrorMessageStub.resetHistory();
    showInformationMessageStub.resetHistory();
    outputChannelStub.resetHistory();
  });

  test("Command triggers completion for JavaScript", async () => {
    const insertSnippetStub = sinon.stub();
    const editor = {
      document: {
        getText: () => "console.log(",
        languageId: "javascript",
        uri: vscode.Uri.parse("file://test.js"),
        fileName: "test.js",
        isUntitled: false,
        version: 1,
        isDirty: false,
        isClosed: false,
        save: async () => true,
        lineAt: () => ({ text: "console.log(" } as any),
      } as unknown as vscode.TextDocument,
      selection: { active: new vscode.Position(0, 12) },
      insertSnippet: insertSnippetStub.resolves(true),
    } as unknown as vscode.TextEditor;

    sinon.stub(vscode.window, "activeTextEditor").value(editor);

    // Execute the command
    await vscode.commands.executeCommand(
      "cursor-llm-autocomplete.triggerCompletion"
    );

    // Verify API call
    assert.strictEqual(
      axiosStub.calledOnce,
      true,
      "axios.post should be called"
    );
    assert.strictEqual(
      axiosStub.args[0][0],
      "http://localhost:11434/api/generate",
      "API endpoint should match default"
    );
    assert.deepStrictEqual(
      axiosStub.args[0][1],
      {
        model: "qwen2.5-coder",
        stream: true,
        prompt: "console.log(",
      },
      "API payload should match"
    );

    // Verify snippet insertion
    assert.strictEqual(
      insertSnippetStub.calledOnce,
      true,
      "insertSnippet should be called"
    );
    const snippet = insertSnippetStub.args[0][0] as vscode.SnippetString;
    assert.strictEqual(
      snippet.value,
      "console.log(42);",
      "Inserted snippet should match mock response"
    );

    // Verify no error or info messages
    assert.strictEqual(
      showErrorMessageStub.called,
      false,
      "No error message should be shown"
    );
    assert.strictEqual(
      showInformationMessageStub.called,
      false,
      "No info message should be shown"
    );
  });

  test("Command fails with no active editor", async () => {
    sinon.stub(vscode.window, "activeTextEditor").value(undefined);

    await vscode.commands.executeCommand(
      "cursor-llm-autocomplete.triggerCompletion"
    );

    assert.strictEqual(
      axiosStub.called,
      false,
      "axios.post should not be called"
    );
    assert.strictEqual(
      showErrorMessageStub.calledOnceWith("No active editor"),
      true,
      "Should show no active editor error"
    );
    assert.strictEqual(
      showInformationMessageStub.called,
      false,
      "No info message should be shown"
    );
  });

  test("Command fails for unsupported language", async () => {
    const editor = {
      document: {
        getText: () => "print(",
        languageId: "python3", // Unsupported language
        uri: vscode.Uri.parse("file://test.py"),
        fileName: "test.py",
        isUntitled: false,
        version: 1,
        isDirty: false,
        isClosed: false,
        save: async () => true,
        lineAt: () => ({ text: "print(" } as any),
      } as unknown as vscode.TextDocument,
      selection: { active: new vscode.Position(0, 6) },
      insertSnippet: sinon.stub().resolves(true),
    } as unknown as vscode.TextEditor;

    sinon.stub(vscode.window, "activeTextEditor").value(editor);

    await vscode.commands.executeCommand(
      "cursor-llm-autocomplete.triggerCompletion"
    );

    assert.strictEqual(
      axiosStub.called,
      false,
      "axios.post should not be called"
    );
    assert.strictEqual(
      showErrorMessageStub.calledOnceWith(
        "Language not supported for LLM autocomplete"
      ),
      true,
      "Should show unsupported language error"
    );
    assert.strictEqual(
      showInformationMessageStub.called,
      false,
      "No info message should be shown"
    );
  });

  test("Command handles empty completion", async () => {
    // Mock empty response
    axiosStub.resolves({
      data: {
        on: (event: string, callback: (chunk: Buffer) => void) => {
          if (event === "end") {
            callback(Buffer.from(""));
          }
        },
      },
    });

    const editor = {
      document: {
        getText: () => "console.log(",
        languageId: "javascript",
        uri: vscode.Uri.parse("file://test.js"),
        fileName: "test.js",
        isUntitled: false,
        version: 1,
        isDirty: false,
        isClosed: false,
        save: async () => true,
        lineAt: () => ({ text: "console.log(" } as any),
      } as unknown as vscode.TextDocument,
      selection: { active: new vscode.Position(0, 12) },
      insertSnippet: sinon.stub().resolves(true),
    } as unknown as vscode.TextEditor;

    sinon.stub(vscode.window, "activeTextEditor").value(editor);

    await vscode.commands.executeCommand(
      "cursor-llm-autocomplete.triggerCompletion"
    );

    assert.strictEqual(
      axiosStub.calledOnce,
      true,
      "axios.post should be called"
    );
    assert.strictEqual(
      showInformationMessageStub.calledOnceWith("No completions available"),
      true,
      "Should show no completions message"
    );
    assert.strictEqual(
      showErrorMessageStub.called,
      false,
      "No error message should be shown"
    );
    assert.strictEqual(
      (editor.insertSnippet as sinon.SinonStub).called,
      false,
      "insertSnippet should not be called"
    );
  });

  test("Command handles API error", async () => {
    // Mock API error
    axiosStub.rejects(new Error("Network error"));

    const editor = {
      document: {
        getText: () => "console.log(",
        languageId: "javascript",
        uri: vscode.Uri.parse("file://test.js"),
        fileName: "test.js",
        isUntitled: false,
        version: 1,
        isDirty: false,
        isClosed: false,
        save: async () => true,
        lineAt: () => ({ text: "console.log(" } as any),
      } as unknown as vscode.TextDocument,
      selection: { active: new vscode.Position(0, 12) },
      insertSnippet: sinon.stub().resolves(true),
    } as unknown as vscode.TextEditor;

    sinon.stub(vscode.window, "activeTextEditor").value(editor);

    await vscode.commands.executeCommand(
      "cursor-llm-autocomplete.triggerCompletion"
    );

    assert.strictEqual(
      axiosStub.calledOnce,
      true,
      "axios.post should be called"
    );
    assert.strictEqual(
      showErrorMessageStub.calledOnceWith("Failed to fetch LLM completion."),
      true,
      "Should show API error message"
    );
    assert.strictEqual(
      outputChannelStub.calledOnceWith(sinon.match(/Error: Network error/)),
      true,
      "Should log error to output channel"
    );
    assert.strictEqual(
      showInformationMessageStub.called,
      false,
      "No info message should be shown"
    );
    assert.strictEqual(
      (editor.insertSnippet as sinon.SinonStub).called,
      false,
      "insertSnippet should not be called"
    );
  });
});
