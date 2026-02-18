import { describe, it, expect, vi, beforeEach } from "vitest";
import handleRequest from "../service";
import { updateProjectMemberRole } from "../../repository";
import { NotFoundError } from "../../../../../../../errors/notFoundError";

vi.mock("../../repository");

const mockUpdateProjectMemberRole = vi.mocked(updateProjectMemberRole);

describe("update member service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update member role successfully", async () => {
    const projectId = "proj-1";
    const params = { userId: "user-1" };
    const body = { role: "project_admin" as const };

    const mockUpdatedMember = {
      id: 123,
      userId: "user-1",
      projectId: "proj-1",
      role: "project_admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUpdateProjectMemberRole.mockResolvedValue(mockUpdatedMember as any);

    const result = await handleRequest(projectId, params, body);

    expect(mockUpdateProjectMemberRole).toHaveBeenCalledWith(
      projectId,
      params.userId,
      body.role,
    );
    expect(result).toEqual({
      id: 123,
      userId: "user-1",
      projectId: "proj-1",
      role: "project_admin",
      createdAt: mockUpdatedMember.createdAt.toISOString(),
      updatedAt: mockUpdatedMember.updatedAt.toISOString(),
    });
  });

  it("should throw NotFoundError if member not found", async () => {
    const projectId = "proj-1";
    const params = { userId: "user-1" };
    const body = { role: "viewer" as const };

    mockUpdateProjectMemberRole.mockResolvedValue(undefined as any);

    await expect(handleRequest(projectId, params, body)).rejects.toThrow(
      NotFoundError,
    );
  });
});
