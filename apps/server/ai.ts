import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";

// const apiKey = "csk-5jcytp36ekefhydm3h9wfvpr8833vm3k989nxdjtxe22x46n";
const apiKey = "sk-ervxavp84m8pofwg3yjxfdg0aqcewm1zo1kdnl5xhg9rluc8";
const model = new ChatOpenAI({
  // model: "gpt-oss-120b",
  model: "mimo-v2-flash",
  configuration: {
    // baseURL: "https://api.cerebras.ai/v1",
    baseURL: "https://api.xiaomimimo.com/v1",
    apiKey,
  },
});
const agent = createAgent({
  model,
  tools: [],
});
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "Hello",
    },
  ],
});

console.log(result.messages[1].content);
