import FluxifyAIPage from "@/components/ai_workflow/FluxifyAIPage";
import React from "react";

const Page = async (params: any) => {
  const { projectId, conversationId } = await params.params;

  return <FluxifyAIPage projectId={projectId} conversationId={conversationId} />;
};

export default Page;
