import { ChatAnthropic } from "@langchain/anthropic";

type AnthropicVariantConfig = {
  apiKey: string;
  model: string;
};

export class AnthropicIntegration {
  static ExtractConnectionInfo(
    config: AnthropicVariantConfig,
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
    config: AnthropicVariantConfig,
    appConfigs: Map<string, string>,
  ) {
    const extractedConfig = this.ExtractConnectionInfo(config, appConfigs);
    const llm = new ChatAnthropic({
      apiKey: extractedConfig.apiKey,
      model: extractedConfig.model,
    });
    const result = await llm.invoke("Say OK");
    return result.content.length > 0;
  }
}
