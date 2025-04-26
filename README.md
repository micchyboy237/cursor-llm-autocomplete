# Cursor LLM Autocomplete

A Visual Studio Code extension for Cursor IDE that provides custom code autocompletion using a local Qwen2.5-Coder model via the Ollama API.

## Features

- AI-powered code autocompletion for Python, JavaScript, and TypeScript.
- Integrates with a local Ollama server at `http://localhost:11434/api/generate`.
- Supports streaming responses for real-time code suggestions.
- Suggestions appear automatically as you type and can be accepted with **Tab**.

## Requirements

- **Ollama**: Install Ollama and pull the `qwen2.5-coder` model:
  ```bash
  ollama pull qwen2.5-coder
  ollama serve
  ```
