import * as vscode from "vscode";
import axios from "axios";

export async function streamCompletion(
  prompt: string,
  apiEndpoint: string,
  model: string
): Promise<string> {
  try {
    const response = await axios.post(
      apiEndpoint,
      {
        model,
        stream: true,
        prompt,
      },
      {
        responseType: "stream",
      }
    );

    let completionText = "";
    const stream = response.data;

    return new Promise<string>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              completionText += json.response;
            }
          } catch (e) {
            console.error("Error parsing JSON chunk:", e);
          }
        }
      });

      stream.on("end", () => {
        resolve(completionText);
      });

      stream.on("error", (err: any) => {
        reject(err);
      });
    });
  } catch (error) {
    throw error;
  }
}
