# Cursor LLM Autocomplete

A VSCode extension that provides AI-powered code autocompletion for Python, JavaScript, and TypeScript using the Qwen2.5-Coder model via a local LLM endpoint, triggered manually with Ctrl+Cmd+K.

## Features

- AI-powered code autocompletion for Python, JavaScript, and TypeScript.
- Triggered via `Ctrl+Cmd+K` or the command palette (`Trigger LLM Autocomplete`).

## Extension Settings

- `cursor-llm-autocomplete.apiEndpoint`: Local LLM API endpoint (default: `http://localhost:11434/api/generate`).
- `cursor-llm-autocomplete.model`: Local LLM model (default: `qwen2.5-coder`).
- `cursor-llm-autocomplete.maxContextLength`: Maximum context length in characters (default: `1000`).
