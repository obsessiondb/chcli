import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { runEnvCommand } from "./env";
import {
  getConfigPath,
  readConfig,
  setEnvironment,
  setDefault,
  writeConfig,
} from "./config";
import { join } from "node:path";

describe("env subcommands", () => {
  let originalConfig: string | null = null;
  const configPath = getConfigPath();

  beforeEach(async () => {
    const file = Bun.file(configPath);
    if (await file.exists()) {
      originalConfig = await file.text();
    } else {
      originalConfig = null;
    }
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(configPath, ".."), { recursive: true });
    await Bun.write(
      configPath,
      JSON.stringify({ environments: {}, defaults: {} }),
    );
  });

  afterEach(async () => {
    if (originalConfig !== null) {
      await Bun.write(configPath, originalConfig);
    } else {
      const { unlink } = await import("node:fs/promises");
      try {
        await unlink(configPath);
      } catch {}
    }
  });

  test("env add creates a new environment", async () => {
    await runEnvCommand([
      "add",
      "prod",
      "--host",
      "ch.prod.com",
      "--port",
      "8443",
      "-s",
      "--no-verify",
    ]);

    const config = await readConfig();
    expect(config.environments.prod).toEqual({
      host: "ch.prod.com",
      port: "8443",
      secure: true,
    });
  });

  test("env add merges with existing environment", async () => {
    await setEnvironment("prod", { host: "old.com", user: "admin" });

    await runEnvCommand(["add", "prod", "--host", "new.com", "--no-verify"]);

    const config = await readConfig();
    expect(config.environments.prod!.host).toBe("new.com");
    expect(config.environments.prod!.user).toBe("admin");
  });

  test("env add rejects environment with no host or url", async () => {
    const spy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    const errSpy = spyOn(console, "error").mockImplementation(() => {});

    await expect(
      runEnvCommand(["add", "empty", "--no-verify"]),
    ).rejects.toThrow("process.exit");

    spy.mockRestore();
    errSpy.mockRestore();

    const config = await readConfig();
    expect(config.environments.empty).toBeUndefined();
  });

  test("env list shows environments", async () => {
    await setEnvironment("prod", { host: "ch.prod.com" });
    await setEnvironment("dev", { host: "localhost" });

    const logs: string[] = [];
    const spy = spyOn(console, "log").mockImplementation((...args: unknown[]) =>
      logs.push(args.join(" ")),
    );

    await runEnvCommand(["list"]);
    spy.mockRestore();

    expect(logs.some((l) => l.includes("prod"))).toBe(true);
    expect(logs.some((l) => l.includes("dev"))).toBe(true);
  });

  test("env show displays environment details", async () => {
    await setEnvironment("prod", {
      host: "ch.prod.com",
      port: "8443",
      user: "admin",
      password: "secret",
      secure: true,
    });

    const logs: string[] = [];
    const spy = spyOn(console, "log").mockImplementation((...args: unknown[]) =>
      logs.push(args.join(" ")),
    );

    await runEnvCommand(["show", "prod"]);
    spy.mockRestore();

    expect(logs.some((l) => l.includes("ch.prod.com"))).toBe(true);
    expect(logs.some((l) => l.includes("****"))).toBe(true);
    expect(logs.every((l) => !l.includes("secret"))).toBe(true);
  });

  test("env remove deletes an environment", async () => {
    await setEnvironment("staging", { host: "staging.com" });

    await runEnvCommand(["remove", "staging"]);

    const config = await readConfig();
    expect(config.environments.staging).toBeUndefined();
  });

  test("env use sets default for current directory", async () => {
    await setEnvironment("prod", { host: "prod.com" });

    await runEnvCommand(["use", "prod"]);

    const config = await readConfig();
    expect(config.defaults[process.cwd()]).toBe("prod");
  });
});
