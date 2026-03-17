import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

// We test the config logic by calling the internal functions with a mocked config path.
// Since config.ts uses a hardcoded path, we test the read/write/get/set functions
// by temporarily replacing the config file.

// Instead of mocking the module, we test the data flow functions directly
// by importing and using them with a temp directory approach.

import {
  readConfig,
  writeConfig,
  getEnvironment,
  setEnvironment,
  removeEnvironment,
  setDefault,
  getDefault,
  getConfigPath,
  type Config,
} from "./config";

// Since config.ts uses a fixed path, we'll test the serialization logic
// by using the actual config path but saving/restoring state.

describe("config", () => {
  let originalConfig: string | null = null;
  const configPath = getConfigPath();

  beforeEach(async () => {
    const file = Bun.file(configPath);
    if (await file.exists()) {
      originalConfig = await file.text();
    } else {
      originalConfig = null;
    }
    // Start with empty config
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(configPath, ".."), { recursive: true });
    await Bun.write(configPath, JSON.stringify({ environments: {}, defaults: {} }));
  });

  afterEach(async () => {
    if (originalConfig !== null) {
      await Bun.write(configPath, originalConfig);
    } else {
      const { unlink } = await import("node:fs/promises");
      try { await unlink(configPath); } catch {}
    }
  });

  test("readConfig returns empty config when file has empty data", async () => {
    const config = await readConfig();
    expect(config.environments).toEqual({});
    expect(config.defaults).toEqual({});
  });

  test("setEnvironment and getEnvironment round-trip", async () => {
    await setEnvironment("prod", {
      host: "ch.prod.com",
      port: "8443",
      secure: true,
      user: "admin",
    });

    const env = await getEnvironment("prod");
    expect(env).toEqual({
      host: "ch.prod.com",
      port: "8443",
      secure: true,
      user: "admin",
    });
  });

  test("setEnvironment overwrites existing environment", async () => {
    await setEnvironment("prod", { host: "old.com" });
    await setEnvironment("prod", { host: "new.com" });

    const env = await getEnvironment("prod");
    expect(env?.host).toBe("new.com");
  });

  test("getEnvironment returns undefined for nonexistent name", async () => {
    const env = await getEnvironment("nope");
    expect(env).toBeUndefined();
  });

  test("removeEnvironment deletes the environment", async () => {
    await setEnvironment("staging", { host: "staging.com" });
    const removed = await removeEnvironment("staging");
    expect(removed).toBe(true);

    const env = await getEnvironment("staging");
    expect(env).toBeUndefined();
  });

  test("removeEnvironment returns false for nonexistent name", async () => {
    const removed = await removeEnvironment("nope");
    expect(removed).toBe(false);
  });

  test("removeEnvironment cleans up defaults pointing to it", async () => {
    await setEnvironment("staging", { host: "staging.com" });
    await setDefault("/some/dir", "staging");

    await removeEnvironment("staging");

    const def = await getDefault("/some/dir");
    expect(def).toBeUndefined();
  });

  test("setDefault and getDefault round-trip", async () => {
    await setEnvironment("prod", { host: "prod.com" });
    await setDefault("/my/project", "prod");

    const def = await getDefault("/my/project");
    expect(def).toBe("prod");
  });

  test("setDefault throws for nonexistent environment", async () => {
    expect(setDefault("/my/project", "nope")).rejects.toThrow(
      'Environment "nope" does not exist',
    );
  });

  test("writeConfig and readConfig preserve structure", async () => {
    const config: Config = {
      environments: {
        prod: { host: "prod.com", secure: true },
        dev: { host: "localhost" },
      },
      defaults: { "/a": "prod", "/b": "dev" },
    };
    await writeConfig(config);

    const loaded = await readConfig();
    expect(loaded).toEqual(config);
  });
});
