import { describe, it, expect, beforeEach, mock, type Mock } from "bun:test";
import handleRequest from "../service";
import * as repository from "../repository";
import * as redis from "../../../../../db/redis";
import { BadRequestError } from "../../../../../errors/badRequestError";
import { db } from "../../../../../db";

// Mock dependencies
mock.module("../repository", () => ({
  checkAppConfigsExist: mock(),
  deleteAppConfigBulk: mock(),
}));
mock.module("../../../../../db/redis", () => ({
  publishMessage: mock(),
  CHAN_ON_APPCONFIG_CHANGE: mock(),
}));
mock.module("../../../../../db", () => ({
  db: {
    transaction: mock(async (callback: any) => {
      return callback({});
    }),
  },
}));

const checkAppConfigsExistMock = repository.checkAppConfigsExist as unknown as Mock<
  typeof repository.checkAppConfigsExist
>;
const deleteAppConfigBulkMock = repository.deleteAppConfigBulk as unknown as Mock<
  typeof repository.deleteAppConfigBulk
>;
const publishMessageMock = redis.publishMessage as unknown as Mock<
  typeof redis.publishMessage
>;
const transactionMock = db.transaction as unknown as Mock<
  typeof db.transaction
>;

describe("Delete Bulk App Config", () => {
  beforeEach(() => {
    checkAppConfigsExistMock.mockClear();
    deleteAppConfigBulkMock.mockClear();
    publishMessageMock.mockClear();
  });

  describe("handleRequest", () => {
    it("should successfully delete multiple app configs", async () => {
      const ids = [1, 2, 3];
      checkAppConfigsExistMock.mockResolvedValue(true);
      deleteAppConfigBulkMock.mockResolvedValue(3);
      publishMessageMock.mockResolvedValue(undefined);

      const result = await handleRequest("test-project", { ids });

      expect(result).toEqual({});
      expect(checkAppConfigsExistMock).toHaveBeenCalledWith(ids, "test-project", {});
      expect(deleteAppConfigBulkMock).toHaveBeenCalledWith(ids, "test-project", {});
      expect(publishMessageMock).toHaveBeenCalled();
    });

    it("should throw error when ids array is empty", async () => {
      const ids: number[] = [];

      await expect(handleRequest("test-project", { ids })).rejects.toThrow(BadRequestError);
      await expect(handleRequest("test-project", { ids })).rejects.toThrow(
        "At least one ID is required"
      );
    });

    it("should throw error when not all app configs exist", async () => {
      const ids = [1, 2, 3];
      checkAppConfigsExistMock.mockResolvedValue(false);

      await expect(handleRequest("test-project", { ids })).rejects.toThrow(
        "One or more app configs not found"
      );
    });

    it("should throw error when deletion fails", async () => {
      const ids = [1, 2, 3];
      checkAppConfigsExistMock.mockResolvedValue(true);
      deleteAppConfigBulkMock.mockResolvedValue(0);

      await expect(handleRequest("test-project", { ids })).rejects.toThrow(
        "Failed to delete app configs"
      );
    });

    it("should handle single id deletion", async () => {
      const ids = [1];
      checkAppConfigsExistMock.mockResolvedValue(true);
      deleteAppConfigBulkMock.mockResolvedValue(1);
      publishMessageMock.mockResolvedValue(undefined);

      const result = await handleRequest("test-project", { ids });

      expect(result).toEqual({});
      expect(deleteAppConfigBulkMock).toHaveBeenCalledWith(ids, "test-project", {});
    });

    it("should publish redis message after successful deletion", async () => {
      const ids = [1, 2];
      checkAppConfigsExistMock.mockResolvedValue(true);
      deleteAppConfigBulkMock.mockResolvedValue(2);
      publishMessageMock.mockResolvedValue(undefined);

      await handleRequest("test-project", { ids });

      expect(publishMessageMock).toHaveBeenCalledWith(
        redis.CHAN_ON_APPCONFIG_CHANGE,
        ""
      );
    });

    it("should use transaction for atomic operations", async () => {
      const ids = [1, 2, 3];
      const mockTx = {} as any;
      transactionMock.mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });
      checkAppConfigsExistMock.mockResolvedValue(true);
      deleteAppConfigBulkMock.mockResolvedValue(3);
      publishMessageMock.mockResolvedValue(undefined);

      await handleRequest("test-project", { ids });

      expect(transactionMock).toHaveBeenCalled();
      expect(checkAppConfigsExistMock).toHaveBeenCalledWith(ids, "test-project", mockTx);
      expect(deleteAppConfigBulkMock).toHaveBeenCalledWith(ids, "test-project", mockTx);
    });
  });

  describe("repository functions", () => {
    it("deleteAppConfigBulk should delete multiple configs", async () => {
      const ids = [1, 2, 3];
      deleteAppConfigBulkMock.mockResolvedValue(3);

      const result = await repository.deleteAppConfigBulk(ids, "test-project");

      expect(result).toBe(3);
    });

    it("checkAppConfigsExist should verify all configs exist", async () => {
      const ids = [1, 2, 3];
      checkAppConfigsExistMock.mockResolvedValue(true);

      const result = await repository.checkAppConfigsExist(ids, "test-project");

      expect(result).toBe(true);
    });

    it("checkAppConfigsExist should return false when configs don't exist", async () => {
      const ids = [999, 1000];
      checkAppConfigsExistMock.mockResolvedValue(false);

      const result = await repository.checkAppConfigsExist(ids, "test-project");

      expect(result).toBe(false);
    });
  });
});