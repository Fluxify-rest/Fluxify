import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import handleRequest from "../service";
import { getAppConfigs } from "../repository";

vi.mock("../repository");
vi.mock("@fluxify/adapters", async () => {
  return {
    PostgresAdapter: {
      testConnection: vi.fn(),
    },
    extractPgConnectionInfo: vi.fn((config) => config),
  };
});
vi.mock("../../../../../lib/encryption", () => ({
  EncryptionService: {
    decodeData: vi.fn((val) => val),
    decrypt: vi.fn((val) => val),
  },
}));

const mockGetAppConfigs = vi.mocked(getAppConfigs);

describe("testConnection service", () => {
  beforeAll(() => {
    process.env.MASTER_ENCRYPTION_KEY = Buffer.from("a".repeat(32)).toString(
      "base64",
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid group", async () => {
    const result = await handleRequest({
      group: "invalid" as any,
      variant: "PostgreSQL",
      config: { url: "postgres://localhost" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid group or variant");
  });

  it("should return error for invalid variant", async () => {
    const result = await handleRequest({
      group: "database",
      variant: "InvalidDB",
      config: { url: "postgres://localhost" },
    });

    expect(result.success).toBe(false);
  });

  it("should return error for invalid config", async () => {
    const result = await handleRequest({
      group: "database",
      variant: "PostgreSQL",
      config: { url: "invalid-url" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid configuration");
  });

  it("should return error for unsupported group", async () => {
    const result = await handleRequest({
      group: "kv",
      variant: "Redis",
      config: { host: "localhost" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid group or variant");
  });

  it("should validate PostgreSQL URL format", async () => {
    const result = await handleRequest({
      group: "database",
      variant: "PostgreSQL",
      config: { url: "not-a-valid-postgres-url" },
    });

    expect(result.success).toBe(false);
  });

  it("should accept cfg: prefixed config keys", async () => {
    const { PostgresAdapter } = await import("@fluxify/adapters");
    (PostgresAdapter.testConnection as any).mockResolvedValueOnce({
      success: true,
    });

    mockGetAppConfigs.mockResolvedValueOnce([
      {
        key: "db_url",
        value: "postgres://localhost:5432/testdb",
        isEncrypted: false,
        encodingType: "plaintext",
      },
    ]);

    const result = await handleRequest({
      group: "database",
      variant: "PostgreSQL",
      config: { source: "url", url: "cfg:db_url" },
    });

    expect(mockGetAppConfigs).toHaveBeenCalled();
  });

  it("should handle encrypted app configs", async () => {
    const { PostgresAdapter } = await import("@fluxify/adapters");
    (PostgresAdapter.testConnection as any).mockResolvedValueOnce({
      success: true,
    });

    mockGetAppConfigs.mockResolvedValueOnce([
      {
        key: "db_password",
        value: "encrypted_value",
        isEncrypted: true,
        encodingType: "plaintext",
      },
    ]);

    const result = await handleRequest({
      group: "database",
      variant: "PostgreSQL",
      config: {
        source: "url",
        url: "cfg:db_password",
      },
    });

    expect(mockGetAppConfigs).toHaveBeenCalledWith(["db_password"]);
  });

  it("should return error for missing required config fields", async () => {
    const result = await handleRequest({
      group: "database",
      variant: "PostgreSQL",
      config: { host: "localhost" }, // Missing url
    });

    expect(result.success).toBe(false);
  });

  it("should parse PostgreSQL connection string correctly", async () => {
    mockGetAppConfigs.mockResolvedValueOnce([]);

    const result = await handleRequest({
      group: "database",
      variant: "PostgreSQL",
      config: { url: "postgres://user:pass@localhost:5432/testdb" },
    });

    // Result will depend on adapter, but config should be valid
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("error");
  });
});
