import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { migrateState } from "../src/services/migration.js";
import {
  canAccess,
  saveRoleProfile,
  deleteRoleProfile,
  saveStaffAccount,
  validateRoleProfiles,
} from "../src/services/roleService.js";
import {
  sanitizeAIConfig,
  testAIConfiguration,
} from "../src/services/aiConfigService.js";
import {
  authenticateDemo,
  companiesForUser,
} from "../src/services/accessService.js";
const seed = JSON.parse(fs.readFileSync("src/data/seed.json"));
const admin = seed.users.find((u) => u.role === "admin");
test("v3 migration adds exactly two sample associations once, preserving business data", () => {
  const old = structuredClone(seed);
  old.version = 3;
  old.users[0].memberships = [old.users[0].memberships[0]];
  const migrated = migrateState(old);
  assert.equal(migrated.version, 4);
  assert.equal(migrated.users[0].memberships.length, 2);
  assert.deepEqual(migrated.orders, old.orders);
  assert.deepEqual(migrated.carts, old.carts);
  migrated.users[0].memberships.pop();
  assert.equal(migrateState(migrated).users[0].memberships.length, 1);
});
test("role permission matrix, assignment and disabling persist", () => {
  const role = {
    id: "order-desk",
    name: "Order desk",
    description: "Orders only",
    active: true,
    permissions: ["orders"],
  };
  let s = saveRoleProfile(seed, admin, role);
  const account = {
    ...seed.users.find((u) => u.role === "inside_sales"),
    id: "staff-test",
    email: "test@demo.tradehub",
    staffRoleId: role.id,
  };
  s = saveStaffAccount(s, admin, account);
  s = JSON.parse(JSON.stringify(s));
  assert.ok(canAccess(s, account, "orders"));
  assert.ok(!canAccess(s, account, "ai"));
  assert.throws(() => deleteRoleProfile(s, admin, role.id), /Reassign/);
  assert.throws(
    () => saveRoleProfile(s, account, { ...role, name: "Forbidden" }),
    /permission/,
  );
  s = saveRoleProfile(s, admin, { ...role, active: false });
  assert.ok(!canAccess(s, account, "orders"));
  assert.throws(
    () => authenticateDemo(s, account.email, account.password, true),
    /inactive/,
  );
  assert.deepEqual(companiesForUser(s, account), []);
});
test("system administrator permissions and last administrator cannot be removed", () => {
  assert.throws(
    () =>
      saveRoleProfile(seed, admin, {
        ...seed.roleProfiles[0],
        permissions: [],
      }),
    /full access/,
  );
  const s = structuredClone(seed);
  s.users.find((u) => u.id === admin.id).active = false;
  assert.throws(() => validateRoleProfiles(s), /at least one/);
  assert.throws(
    () => saveStaffAccount(seed, admin, { ...admin, active: false }),
    /own staff/,
  );
});
test("AI configuration excludes keys, validates fields and simulates success/failure", () => {
  const c = sanitizeAIConfig({
    ...seed.aiConfig,
    apiKey: "secret",
    password: "secret",
    requireReview: false,
    retainInput: true,
  });
  assert.ok(!("apiKey" in c));
  assert.ok(!("password" in c));
  assert.equal(c.requireReview, true);
  assert.equal(c.retainInput, false);
  assert.throws(() => sanitizeAIConfig({ ...c, timeout: 0 }), /timeout/);
  assert.throws(
    () => sanitizeAIConfig({ ...c, provider: "azure_openai", deployment: "" }),
    /deployment/,
  );
  assert.equal(testAIConfiguration(c).status, "simulated_success");
  assert.equal(testAIConfiguration(c, true).status, "error");
  assert.equal(testAIConfiguration({ ...c, enabled: false }).status, "error");
});
