#!/usr/bin/env bun
import { run } from "./src/run";

run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
