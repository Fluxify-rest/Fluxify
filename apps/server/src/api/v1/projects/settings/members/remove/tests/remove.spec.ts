import { describe, it, expect, vi, beforeEach } from "vitest";
import handleRequest from "../service";
import { removeProjectMember } from "../../repository";
import { NotFoundError } from "../../../../../../../errors/notFoundError";

vi.mock("../../repository");

const mockRemoveProjectMember = vi.mocked(removeProjectMember);

describe("remove member service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remove member successfully", async () => {
    const projectId = "proj-1";
    const params = { userId: "user-1" };

    mockRemoveProjectMember.mockResolvedValue({ id: 123 } as any);

    const result = await handleRequest(projectId, params);

    expect(mockRemoveProjectMember).toHaveBeenCalledWith(
      projectId,
      params.userId,
    );
    expect(result).toBe("ok");
  });

  it("should throw NotFoundError if member not found", async () => {
    const projectId = "proj-1";
    const params = { userId: "user-1" };

    mockRemoveProjectMember.mockResolvedValue(undefined as any);

    await expect(handleRequest(projectId, params)).rejects.toThrow(
      NotFoundError,
    );
  });
});
