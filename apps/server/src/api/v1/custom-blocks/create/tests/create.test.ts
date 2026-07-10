import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";
mock.module("../../../../../db", () => ({
  db: {
    transaction: async (cb: any) => await cb({}),
  },
}));

import handleRequest from "../service";
import * as repo from "../repository";
import { NotFoundError } from "../../../../../errors/notFoundError";
import { ConflictError } from "../../../../../errors/conflictError";

describe("Create Custom Block Service", () => {
  beforeEach(() => {
    mock.restore();
  });

  it("should create successfully", async () => {
    spyOn(repo, "checkProjectExist").mockResolvedValue(true);
    spyOn(repo, "checkCustomBlockExist").mockResolvedValue(false);
    spyOn(repo, "createCustomBlock").mockResolvedValue("block_123");
    spyOn(repo, "createDependencies").mockResolvedValue();

    const data = {
      projectId: "proj_123",
      name: "my_block",
      label: "My Block",
    };
    const res = await handleRequest(data);
    expect(res.id).toBe("block_123");
  });

  it("should throw NotFoundError if project does not exist", async () => {
    spyOn(repo, "checkProjectExist").mockResolvedValue(false);
    
    const data = {
      projectId: "proj_123",
      name: "my_block",
      label: "My Block",
    };
    expect(handleRequest(data)).rejects.toThrow(NotFoundError);
  });

  it("should throw ConflictError if name exists", async () => {
    spyOn(repo, "checkProjectExist").mockResolvedValue(true);
    spyOn(repo, "checkCustomBlockExist").mockResolvedValue(true);
    
    const data = {
      projectId: "proj_123",
      name: "my_block",
      label: "My Block",
    };
    expect(handleRequest(data)).rejects.toThrow(ConflictError);
  });
});
