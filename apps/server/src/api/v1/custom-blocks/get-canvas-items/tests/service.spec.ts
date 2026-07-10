import { describe, it, expect, mock, spyOn } from "bun:test";
import handleRequest from "../service";
import * as repository from "../repository";
import { NotFoundError } from "../../../../../errors/notFoundError";

describe("Custom Blocks get-canvas-items service", () => {
  it("should extract embedded connections and format blocks and edges", async () => {
    spyOn(repository, "getCustomBlockById").mockResolvedValue({ projectId: "proj1" } as any);
    
    spyOn(repository, "getCustomBlockGraphs").mockResolvedValue([
      {
        id: "block1",
        type: "Trigger",
        data: {
          position: { x: 10, y: 20 },
          label: "My Block",
          connections: [
            {
              id: "edge1",
              to: "block2",
              toHandle: "target",
              fromHandle: "source",
            },
          ],
        },
      },
      {
        id: "block2",
        type: "Action",
        data: {
          position: { x: 100, y: 200 },
          label: "Second Block",
        },
      },
    ] as any);

    const result = await handleRequest(
      "custom-block-1",
      { id: "user1", isSystemAdmin: true } as any,
      []
    );

    expect(result.blocks.length).toBe(2);
    expect(result.edges.length).toBe(1);

    expect(result.blocks[0].id).toBe("block1");
    expect(result.blocks[0].position).toEqual({ x: 10, y: 20 });
    expect(result.blocks[0].data).toEqual({ label: "My Block", position: { x: 10, y: 20 } }); // position should be present in data

    expect(result.edges[0]).toEqual({
      id: "edge1",
      from: "block1",
      to: "block2",
      fromHandle: "source",
      toHandle: "target",
    });
  });

  it("should throw NotFoundError if custom block does not exist", async () => {
    spyOn(repository, "getCustomBlockById").mockResolvedValue(null);

    expect(
      handleRequest("invalid-id", { id: "user1", isSystemAdmin: true } as any, [])
    ).rejects.toThrow(NotFoundError);
  });
});
