import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".config", "chcli");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export interface Environment {
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
  secure?: boolean;
  url?: string;
}

export interface Config {
  environments: Record<string, Environment>;
  defaults: Record<string, string>;
}

function emptyConfig(): Config {
  return { environments: {}, defaults: {} };
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export async function readConfig(): Promise<Config> {
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) {
    return emptyConfig();
  }
  const raw = await file.json();
  return {
    environments: raw.environments ?? {},
    defaults: raw.defaults ?? {},
  };
}

export async function writeConfig(config: Config): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

export async function getEnvironment(
  name: string,
): Promise<Environment | undefined> {
  const config = await readConfig();
  return config.environments[name];
}

export async function setEnvironment(
  name: string,
  env: Environment,
): Promise<void> {
  const config = await readConfig();
  config.environments[name] = env;
  await writeConfig(config);
}

export async function removeEnvironment(name: string): Promise<boolean> {
  const config = await readConfig();
  if (!(name in config.environments)) {
    return false;
  }
  delete config.environments[name];
  // Also remove any defaults pointing to this environment
  for (const [dir, envName] of Object.entries(config.defaults)) {
    if (envName === name) {
      delete config.defaults[dir];
    }
  }
  await writeConfig(config);
  return true;
}

export async function setDefault(
  directory: string,
  envName: string,
): Promise<void> {
  const config = await readConfig();
  if (!(envName in config.environments)) {
    throw new Error(`Environment "${envName}" does not exist`);
  }
  config.defaults[directory] = envName;
  await writeConfig(config);
}

export async function getDefault(directory: string): Promise<string | undefined> {
  const config = await readConfig();
  return config.defaults[directory];
}
