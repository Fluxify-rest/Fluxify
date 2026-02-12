import { ChatMistralAI } from "@langchain/mistralai";

type MistralVariantConfig = {
  apiKey: string;
  model: string;
};

export class MistralIntegration {
  static ExtractConnectionInfo(
    config: MistralVariantConfig,
    appConfigs: Map<string, string>,
  ) {
    if (config.apiKey.startsWith("cfg:")) {
      const apiKey = appConfigs.get(config.apiKey.slice(4));
      if (!apiKey) {
        throw new Error("API key not found");
      }
      config.apiKey = apiKey;
    }
    return config;
  }

  static async TestConnection(
    config: MistralVariantConfig,
    appConfigs: Map<string, string>,
  ) {
    const extractedConfig = this.ExtractConnectionInfo(config, appConfigs);
    const llm = new ChatMistralAI({
      apiKey: extractedConfig.apiKey,
      model: extractedConfig.model,
    });
    const result = await llm.invoke("Say OK", {
      timeout: 5_000,
    });
    return result.content.length > 0;
  }
}
