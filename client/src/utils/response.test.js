import test from "node:test";
import assert from "node:assert/strict";
import { BACKEND_UNAVAILABLE, handleResponse } from "./response.js";

test("handles structured API errors", async () => {
  await assert.rejects(
    handleResponse(new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 })),
    { message: "Invalid credentials" },
  );
});

test("turns empty and non-JSON proxy errors into a useful message", async () => {
  for (const response of [new Response(null, { status: 502 }), new Response("Bad Gateway", { status: 502 })]) {
    await assert.rejects(handleResponse(response), { message: BACKEND_UNAVAILABLE });
  }
});

test("returns parsed JSON on success", async () => {
  const result = await handleResponse(new Response(JSON.stringify({ user: { id: 1 } }), { status: 200 }));
  assert.deepEqual(result, { user: { id: 1 } });
});
