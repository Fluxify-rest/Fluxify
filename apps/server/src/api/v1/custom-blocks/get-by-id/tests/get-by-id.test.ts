import { describe, it, expect, mock, spyOn, beforeEach } from "bun:test";
import handleRequest from "../service";
import * as repo from "../repository";
import { NotFoundError } from "../../../../../errors/notFoundError";
import { ForbiddenError } from "../../../../../errors/forbidError";
import * as authCommon from "../../../../auth/common";

describe("Get-By-Id Custom Blocks Service", () => {
  const mockUser = { id: "u1", isSystemAdmin: false } as any;
  const mockAcl: any[] = [];

  beforeEach(() => {
    mock.restore();
  });

  it("should return the block", async () => {
    spyOn(repo, "getCustomBlockById").mockResolvedValue({ id: "1", projectId: "p1" } as any);
    spyOn(authCommon, "hasProjectAccess").mockReturnValue(true);

    const res = await handleRequest("1", mockUser, mockAcl);
    expect(res.id).toBe("1");
  });

  it("should throw NotFound if not found", async () => {
    spyOn(repo, "getCustomBlockById").mockResolvedValue(undefined as any);

    expect(handleRequest("1", mockUser, mockAcl)).rejects.toThrow(NotFoundError);
  });

  it("should throw Forbidden if no access", async () => {
    spyOn(repo, "getCustomBlockById").mockResolvedValue({ id: "1", projectId: "p1" } as any);
    spyOn(authCommon, "hasProjectAccess").mockReturnValue(false);

    expect(handleRequest("1", mockUser, mockAcl)).rejects.toThrow(ForbiddenError);
  });
});
