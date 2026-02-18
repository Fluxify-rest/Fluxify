import { describe, it, expect, vi, beforeEach } from "vitest";
import handleRequest from "../service";
import { listProjectMembers } from "../../repository";

vi.mock("../../repository");

const mockListProjectMembers = vi.mocked(listProjectMembers);

describe("list members service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list members with pagination", async () => {
    const projectId = "proj-1";
    const query = {
      page: 1,
      perPage: 10,
    };

    const mockMembers = [
      {
        id: "mem-1",
        name: "Test User",
        userId: "user-1",
        role: "creator" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockListProjectMembers.mockResolvedValue({
      result: mockMembers,
      totalCount: 1,
    });

    const result = await handleRequest(projectId, query);

    expect(mockListProjectMembers).toHaveBeenCalledWith(projectId, 0, 10, {
      role: undefined,
      name: undefined,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe("mem-1");
    expect(result.pagination).toEqual({
      page: 1,
      totalPages: 1,
      hasNext: false,
    });
  });

  it("should calculate pagination correctly", async () => {
    const projectId = "proj-1";
    const query = {
      page: 2,
      perPage: 5,
    };

    mockListProjectMembers.mockResolvedValue({
      result: [],
      totalCount: 20,
    });

    const result = await handleRequest(projectId, query);

    expect(mockListProjectMembers).toHaveBeenCalledWith(projectId, 5, 5, {
      role: undefined,
      name: undefined,
    });

    expect(result.pagination).toEqual({
      page: 2,
      totalPages: 4,
      hasNext: true, // 5 + 0 < 20
    });
  });

  it("should filter by role and name", async () => {
    const projectId = "proj-1";
    const query = {
      page: 1,
      perPage: 10,
      role: "viewer" as const,
      name: "Alice",
    };

    mockListProjectMembers.mockResolvedValue({
      result: [],
      totalCount: 0,
    });

    await handleRequest(projectId, query);

    expect(mockListProjectMembers).toHaveBeenCalledWith(projectId, 0, 10, {
      role: "viewer",
      name: "Alice",
    });
  });
});
