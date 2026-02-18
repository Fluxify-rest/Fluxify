import { describe, it, expect, vi, beforeEach } from "vitest";
import handleRequest from "../service";
import { addProjectMember, projectMemberExists } from "../../repository";
import { ConflictError } from "../../../../../../../errors/conflictError";

vi.mock("../../repository");

const mockAddProjectMember = vi.mocked(addProjectMember);
const mockProjectMemberExists = vi.mocked(projectMemberExists);

describe("add member service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add a new member successfully", async () => {
    const projectId = "proj-1";
    const body = {
      userId: "user-1",
      role: "viewer" as const,
    };

    mockProjectMemberExists.mockResolvedValue(false);
    mockAddProjectMember.mockResolvedValue({ id: 123 } as any);

    const result = await handleRequest(projectId, body);

    expect(mockProjectMemberExists).toHaveBeenCalledWith(
      projectId,
      body.userId,
    );
    expect(mockAddProjectMember).toHaveBeenCalledWith(
      projectId,
      body.userId,
      body.role,
    );
    expect(result).toEqual({ id: 123 });
  });

  it("should throw ConflictError if member already exists", async () => {
    const projectId = "proj-1";
    const body = {
      userId: "user-1",
      role: "viewer" as const,
    };

    mockProjectMemberExists.mockResolvedValue(true);

    await expect(handleRequest(projectId, body)).rejects.toThrow(ConflictError);
    expect(mockAddProjectMember).not.toHaveBeenCalled();
  });
});
