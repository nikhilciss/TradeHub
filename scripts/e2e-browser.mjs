// Run against an existing isolated headless Chrome (--remote-debugging-port=9223).
// Each run creates/disposes its own incognito context; existing browser data is untouched.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const base = process.env.E2E_BASE_URL || "http://192.168.2.180:5173";
const debuggerURL = process.env.E2E_CDP_URL || "http://127.0.0.1:9223";
const output = process.env.E2E_OUTPUT || "/tmp/tradehub-e2e-" + Date.now();
console.log("ARTIFACTS", output);
fs.mkdirSync(output, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((r, j) => {
    ws.addEventListener("open", r, { once: true });
    ws.addEventListener("error", j, { once: true });
  });
  let n = 0;
  const pending = new Map(),
    events = [];
  ws.addEventListener("message", (e) => {
    const d = JSON.parse(e.data);
    if (d.id) {
      const p = pending.get(d.id);
      pending.delete(d.id);
      clearTimeout(p?.timer);
      if (p)
        d.error
          ? p.reject(Error(JSON.stringify(d.error)))
          : p.resolve(d.result);
    } else events.push(d);
  });
  return {
    events,
    close: () => ws.close(),
    call: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++n;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(Error("CDP timeout: " + method));
        }, 15000);
        pending.set(id, { resolve, reject, timer });
        ws.send(JSON.stringify({ id, method, params }));
      }),
  };
}
const version = await (await fetch(debuggerURL + "/json/version")).json();
const browser = await connect(version.webSocketDebuggerUrl);
const { browserContextId } = await browser.call("Target.createBrowserContext");
const { targetId } = await browser.call("Target.createTarget", {
  url: "about:blank",
  browserContextId,
});
const targets = await (await fetch(debuggerURL + "/json")).json();
const page = await connect(
  targets.find((t) => t.id === targetId).webSocketDebuggerUrl,
);
const results = [];
let current = "setup";
const evaluate = async (expression) => {
  const r = await page.call("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails)
    throw Error(
      r.exceptionDetails.exception?.description || r.exceptionDetails.text,
    );
  return r.result.value;
};
async function wait(expression) {
  for (let n = 0; n < 80; n++) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw Error("Timed out: " + expression);
}
async function go(route) {
  await page.call("Page.navigate", { url: base + route });
  await wait(`!!document.querySelector('#root')?.innerText`);
  await sleep(120);
}
const body = () => evaluate("document.body.innerText");
const state = () =>
  evaluate(`JSON.parse(localStorage.getItem('tradehub-demo-v4'))`);
async function click(text, scope = "document") {
  await evaluate(
    `(()=>{const el=[...${scope}.querySelectorAll('button,a')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!el)throw Error('Missing button/link: '+${JSON.stringify(text)});if(el.disabled)throw Error('Disabled button: '+${JSON.stringify(text)});el.click()})()`,
  );
  await sleep(100);
}
async function fillSelector(selector, value) {
  await evaluate(
    `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input '+${JSON.stringify(selector)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`,
  );
  await sleep(60);
}
async function fill(label, value, scope = "document") {
  const selector = await evaluate(
    `(()=>{const l=[...${scope}.querySelectorAll('label')].find(e=>e.firstChild.textContent.trim()===${JSON.stringify(label)});const e=l?.querySelector('input,textarea,select');if(!e)throw Error('Missing label '+${JSON.stringify(label)});e.setAttribute('data-e2e-field','target');return '[data-e2e-field="target"]'})()`,
  );
  await fillSelector(selector, value);
  await evaluate(
    `document.querySelector('[data-e2e-field="target"]').removeAttribute('data-e2e-field')`,
  );
}
async function login(
  email = "buyer@demo.tradehub",
  password = "Demo@123",
  admin = false,
  company = "Müller Maschinenbau GmbH",
) {
  await go(admin ? "/admin/login" : "/login");
  await fill("Email", email);
  await fill("Public demo password", password);
  await click("Log in");
  await wait(`!location.pathname.endsWith('/login')`);
  if (await evaluate(`location.pathname==='/companies'`)) {
    await evaluate(
      `(()=>{const el=[...document.querySelectorAll('.company-card')].find(e=>e.textContent.includes(${JSON.stringify(company)}));if(!el)throw Error('Company missing');el.click()})()`,
    );
    await sleep(120);
  }
}
async function step(name, fn) {
  if (process.env.E2E_FILTER && !new RegExp(process.env.E2E_FILTER).test(name))
    return;
  current = name;
  await fn();
  results.push({ name, status: "passed" });
  console.log("PASS", name);
}
async function upload(selector, file) {
  const { root } = await page.call("DOM.getDocument");
  const { nodeId } = await page.call("DOM.querySelector", {
    nodeId: root.nodeId,
    selector,
  });
  await page.call("DOM.setFileInputFiles", { nodeId, files: [file] });
  await sleep(180);
}
async function download(text) {
  const before = new Set(fs.readdirSync(output));
  await click(text);
  for (let i = 0; i < 100; i++) {
    const file = fs
      .readdirSync(output)
      .find((f) => !before.has(f) && !f.endsWith(".crdownload"));
    if (file) return path.join(output, file);
    await sleep(100);
  }
  throw Error("Download not received: " + text);
}
try {
  await page.call("Page.enable");
  await page.call("Runtime.enable");
  await page.call("Network.enable");
  await browser.call("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: output,
    browserContextId,
    eventsEnabled: true,
  });
  await step("Anonymous catalog and admin routes require login", async () => {
    await go("/store/catalog");
    await wait(`location.pathname==='/login'`);
    assert.ok(!(await body()).includes("Add to cart"));
    await go("/admin/products");
    await wait(`location.pathname==='/admin/login'`);
    assert.ok((await body()).includes("Back to B2B customer login"));
  });
  await step("Customer login offers exactly two linked companies", async () => {
    await go("/login");
    await click("Log in");
    await wait(`location.pathname==='/companies'`);
    assert.equal(
      await evaluate(`document.querySelectorAll('.company-card').length`),
      2,
    );
    await evaluate(`document.querySelector('.company-card').click()`);
    await wait(`location.pathname==='/store'`);
  });
  await step(
    "Catalog SKU search, favorites and product add-to-cart",
    async () => {
      await go("/store/catalog?q=PNE-3201");
      assert.ok((await body()).includes("Compact cylinder"));
      await go("/store/products/p1");
      await click("Remove favorite");
      await click("Save to favorites");
      assert.ok((await state()).favorites.c1.includes("p1"));
      await click("Add to cart");
      assert.equal((await state()).carts.c1[0].productId, "p1");
    },
  );
  await step("Company switching isolates carts", async () => {
    await go("/companies");
    await evaluate(
      `[...document.querySelectorAll('.company-card')].find(e=>e.textContent.includes('Alpen Technik')).click()`,
    );
    await sleep(100);
    await go("/store/cart");
    assert.ok(!(await body()).includes("Quantity PNE"));
    assert.equal((await state()).carts.c2.length, 0);
    await go("/companies");
    await evaluate(`document.querySelector('.company-card').click()`);
    await sleep(100);
  });
  await step("Save named cart template and submit normal order", async () => {
    await go("/store/cart");
    await fillSelector('[aria-label="Template name"]', "E2E recurring order");
    await click("Save");
    assert.ok(
      (await state()).templates.some((t) => t.name === "E2E recurring order"),
    );
    await click("Proceed to checkout");
    await fill("Purchase order reference", "E2E-normal");
    await click("Submit demo order");
    await wait(`location.pathname==='/store/orders'`);
    const order = (await state()).orders.find(
      (o) => o.reference === "E2E-normal",
    );
    assert.equal(order.status, "submitted");
    assert.equal((await state()).carts.c1.length, 0);
  });
  await step(
    "Load template, clear cart, CSV upload with duplicates and invalid SKU",
    async () => {
      await go("/store/templates");
      await click(
        "Load into cart",
        `[...document.querySelectorAll('section')].find(e=>e.textContent.includes('E2E recurring order'))`,
      );
      assert.ok((await state()).carts.c1.length);
      await go("/store/cart");
      await click("Clear cart");
      fs.writeFileSync(
        output + "/quick-order.csv",
        "SKU,quantity\nPNE-3201,2\nPNE-3201,3\nUNKNOWN,2",
      );
      await go("/store/quick-order");
      await upload("input[type=file]", output + "/quick-order.csv");
      await click(
        "Review lines",
        `[...document.querySelectorAll('section')].find(e=>e.textContent.includes('Upload CSV'))`,
      );
      assert.ok((await body()).includes("Unknown SKU"));
      await click("Add valid lines to cart");
      assert.equal(
        (await state()).carts.c1.find((i) => i.productId === "p1").qty,
        5,
      );
    },
  );
  await step(
    "Removing a reviewed Quick Order row invalidates the review",
    async () => {
      await go("/store/quick-order");
      await fillSelector('input[list="bulk-skus"]', "PNE-3201");
      await click("+ Add row");
      await fillSelector(
        '.sku-row:nth-child(3) input[list="bulk-skus"]',
        "FAS-3201",
      );
      await click("Review lines");
      await evaluate(`document.querySelectorAll('.sku-row button')[1].click()`);
      await sleep(100);
      assert.ok(!(await body()).includes("Add valid lines to cart"));
    },
  );
  await step("High-value checkout requires approval", async () => {
    await go("/store/cart");
    await click("Clear cart");
    await go("/store/quick-order");
    await fill("Paste CSV", "SKU,quantity\nTLS-3201,5");
    await click(
      "Review lines",
      `[...document.querySelectorAll('section')].find(e=>e.textContent.includes('Upload CSV'))`,
    );
    await click("Add valid lines to cart");
    await go("/store/checkout");
    await fill("Purchase order reference", "E2E-approval");
    await click("Submit demo order");
    await wait(`location.pathname==='/store/orders'`);
    assert.equal(
      (await state()).orders.find((o) => o.reference === "E2E-approval").status,
      "pending_approval",
    );
  });
  await step("Customer administrator approves purchase", async () => {
    await login("manager@demo.tradehub");
    const o = (await state()).orders.find(
      (o) => o.reference === "E2E-approval",
    );
    await go("/store/orders/" + o.id);
    await click("Approve purchase");
    assert.equal(
      (await state()).orders.find((x) => x.id === o.id).status,
      "submitted",
    );
  });
  await step(
    "Admin sees orders, no cart indicator; simulated Odoo sync",
    async () => {
      await login("admin@demo.tradehub", "Admin@123", true);
      assert.equal(
        await evaluate(`!!document.querySelector('.cart-button')`),
        false,
      );
      await go("/admin/odoo");
      await click("Run full demo sync");
      await sleep(900);
      assert.equal(
        (await state()).orders.find((o) => o.reference === "E2E-approval")
          .erpStatus,
        "synced",
      );
      assert.ok((await state()).syncLogs.length);
    },
  );
  await step(
    "Fulfillment and invoice creation reflect customer history",
    async () => {
      const o = (await state()).orders.find(
        (o) => o.reference === "E2E-approval",
      );
      await go("/admin/orders/" + o.id);
      await fill("Fulfillment state", "shipped");
      await click("Create sample invoice");
      assert.ok((await state()).orders.find((x) => x.id === o.id).invoiceId);
      await login();
      await go("/store/orders/" + o.id);
      assert.ok((await body()).toLowerCase().includes("shipped"));
      await click("Reorder into cart");
      assert.ok((await state()).carts.c1.length);
    },
  );
  await step("Download actual watermarked invoice PDF", async () => {
    await go("/store/invoices");
    const file = await download("Sample PDF");
    assert.equal(fs.readFileSync(file).subarray(0, 4).toString(), "%PDF");
    console.log("INVOICE", file);
  });
  await step("Admin discount change affects buyer pricing", async () => {
    await login("admin@demo.tradehub", "Admin@123", true);
    await go("/admin/customers");
    await click(
      "Edit",
      `[...document.querySelectorAll('tr')].find(e=>e.textContent.includes('Müller Maschinenbau'))`,
    );
    await fill("Discount (%)", 25);
    await click("Save contract");
    assert.equal((await state()).companies[0].discount, 25);
    await login();
    await go("/store/products/p1");
    const s = await state();
    const expected = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(s.products.find((p) => p.id === "p1").price * 0.75);
    assert.ok(
      (await body())
        .replaceAll("\u00a0", " ")
        .includes(expected.replaceAll("\u00a0", " ")),
    );
  });
  await step(
    "AI text suggestions remain reviewable and add to cart",
    async () => {
      await go("/store/cart");
      await click("Clear cart");
      await go("/store/ai-preview");
      await click("Suggest order lines");
      assert.ok((await body()).includes("Suggested order lines"));
      await click("Add selected lines to cart");
      assert.equal((await state()).carts.c1.length, 2);
    },
  );
  await step(
    "Local support draft persists without claiming delivery",
    async () => {
      await go("/store/support");
      await fill("Subject / order reference", "E2E support");
      await fill("How can we help?", "Local only");
      await click("Save local support draft");
      assert.ok((await body()).includes("No message is emailed"));
    },
  );
  await step("Product creation and reload persistence", async () => {
    await login("admin@demo.tradehub", "Admin@123", true);
    await go("/admin/products");
    await click("+ Add product");
    for (const [k, v] of [
      ["Product name", "E2E component"],
      ["SKU", "E2E-NEW-1"],
      ["Brand", "Demo"],
      ["Product description", "Test component"],
    ])
      await fill(k, v);
    await click("Save product");
    assert.ok((await state()).products.some((p) => p.sku === "E2E-NEW-1"));
    await go("/admin/products");
    assert.ok((await state()).products.some((p) => p.sku === "E2E-NEW-1"));
  });
  await step("AI configuration saves and simulates test", async () => {
    await go("/admin/ai");
    await fill("Integration name", "E2E AI configuration");
    await click("Save configuration");
    await click("Test configuration");
    await sleep(700);
    assert.equal((await state()).aiConfig.status, "simulated_success");
  });
  await step("Role profile creation", async () => {
    await go("/admin/roles");
    await click("Create role");
    await fill("Role name", "E2E order desk");
    await click("Save role");
    assert.ok(
      (await state()).roleProfiles.some((r) => r.name === "E2E order desk"),
    );
  });
  let snapshot;
  await step("Export JSON, reset, import restores mutations", async () => {
    await go("/admin/settings");
    snapshot = await download("Export JSON snapshot");
    const saved = JSON.parse(fs.readFileSync(snapshot));
    assert.ok(saved.products.some((p) => p.sku === "E2E-NEW-1"));
    await click("Reset demo data");
    await click("Restore seed data");
    assert.equal((await state()).products.length, 54);
    await upload("input[type=file]", snapshot);
    assert.ok((await state()).products.some((p) => p.sku === "E2E-NEW-1"));
    assert.ok(
      (await state()).orders.some((o) => o.reference === "E2E-approval"),
    );
  });
  await step("Inside sales blocked from admin configuration", async () => {
    await login("support@demo.tradehub", "Support@123", true);
    await go("/admin/roles");
    assert.ok((await body()).includes("You do not have permission"));
    await go("/admin/ai");
    assert.ok((await body()).includes("You do not have permission"));
  });
  await step(
    "Field sales offline draft reconnects into company cart",
    async () => {
      await login("sales@demo.tradehub", "Sales@123", true);
      await click("Simulate offline");
      await click("Save offline preview draft");
      assert.ok((await state()).drafts.length);
      await click("Reconnect preview");
      await click("Move to cart");
      assert.equal((await state()).drafts.length, 0);
    },
  );
  await step(
    "Failed draft transfer retains all lines and leaves cart unchanged",
    async () => {
      const before = (await state()).carts.c1;
      await click("Simulate offline");
      await fill("SKU,quantity", "PNE-3201,99999\nFAS-3201,1");
      await click("Save offline preview draft");
      await click("Reconnect preview");
      await click("Move to cart");
      assert.equal((await state()).drafts.length, 1);
      assert.deepEqual((await state()).carts.c1, before);
    },
  );
  await step(
    "Desktop/tablet/mobile routes render without horizontal page overflow",
    async () => {
      await login();
      for (const width of [1440, 768, 390]) {
        await page.call("Emulation.setDeviceMetricsOverride", {
          width,
          height: 1000,
          deviceScaleFactor: 1,
          mobile: false,
        });
        for (const route of [
          "/companies",
          "/store",
          "/store/catalog",
          "/store/products/p1",
          "/store/cart",
          "/store/checkout",
          "/store/quick-order",
          "/store/ai-preview",
          "/store/account",
          "/store/orders",
          "/store/invoices",
          "/store/templates",
          "/store/support",
        ]) {
          await go(route);
          if (
            [
              "/companies",
              "/store",
              "/store/account",
              "/store/checkout",
            ].includes(route)
          ) {
            const shot = await page.call("Page.captureScreenshot", {
              format: "png",
            });
            fs.writeFileSync(
              output + `/layout-${width}-${route.replaceAll("/", "_")}.png`,
              Buffer.from(shot.data, "base64"),
            );
          }
          assert.ok(
            await evaluate(
              `document.documentElement.scrollWidth<=innerWidth+1`,
            ),
            `${width} ${route}: horizontal overflow`,
          );
        }
        const shot = await page.call("Page.captureScreenshot", {
          format: "png",
        });
        fs.writeFileSync(
          output + `/layout-${width}.png`,
          Buffer.from(shot.data, "base64"),
        );
      }
    },
  );
  await step("Category create, storefront propagation and delete", async () => {
    await login("admin@demo.tradehub", "Admin@123", true);
    await go("/admin/categories");
    await click("+ Add category");
    await fill("Category name", "E2E category");
    await click("Save category");
    const category = (await state()).categories.find(
      (c) => c.name === "E2E category",
    );
    assert.ok(category);
    await login();
    await go("/store");
    assert.ok((await body()).includes("E2E category"));
    await login("admin@demo.tradehub", "Admin@123", true);
    await go("/admin/categories");
    await click(
      "Delete",
      `[...document.querySelectorAll('tr')].find(e=>e.textContent.includes('E2E category'))`,
    );
    await click("Delete", `document.querySelector('.modal')`);
    assert.ok(!(await state()).categories.some((c) => c.id === category.id));
  });
  await step(
    "Customer administrator creates company user; buyer cannot manage users",
    async () => {
      await login("manager@demo.tradehub");
      await go("/store/account/users");
      await click("Add company user");
      await fill("Name", "E2E buyer");
      await fill("Email", "e2e-buyer@demo.tradehub");
      await click("Save");
      assert.ok(
        (await state()).users.some(
          (u) =>
            u.email === "e2e-buyer@demo.tradehub" &&
            u.memberships[0].companyId === "c1",
        ),
      );
      await login("e2e-buyer@demo.tradehub");
      await go("/store/account/users");
      assert.ok(!(await body()).includes("Add company user"));
    },
  );
  await step("Delivery address create and persistence", async () => {
    await login();
    await go("/store/account/addresses");
    await click("+ Add address");
    for (const [k, v] of [
      ["Address label", "E2E warehouse"],
      ["Street", "Demo street 1"],
      ["Postal code", "70173"],
      ["City", "Stuttgart"],
    ])
      await fill(k, v);
    await click("Save address");
    await go("/store/account/addresses");
    assert.ok((await body()).includes("E2E warehouse"));
  });
  await step(
    "Profile/category dropdown outside-click dismissal and language switch",
    async () => {
      await go("/store");
      for (const name of ["account", "category"]) {
        await evaluate(
          `document.querySelector('.${name}-dropdown summary').click()`,
        );
        assert.ok(
          await evaluate(`document.querySelector('.${name}-dropdown').open`),
        );
        await evaluate(
          `document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`,
        );
        assert.ok(
          await evaluate(`!document.querySelector('.${name}-dropdown').open`),
        );
      }
      await evaluate(`document.querySelector('.language').click()`);
      await sleep(100);
      assert.ok((await body()).includes("Schnellbestellung"));
      await evaluate(`document.querySelector('.language').click()`);
      await sleep(100);
    },
  );
  await step(
    "Odoo connection test and invalid snapshot rejection",
    async () => {
      await login("admin@demo.tradehub", "Admin@123", true);
      await go("/admin/odoo");
      await click("Test connection");
      await sleep(800);
      assert.equal((await state()).odoo.connectionStatus, "connected");
      await go("/admin/settings");
      const before = JSON.stringify(await state());
      fs.writeFileSync(output + "/invalid.json", '{"version":4}');
      await upload("input[type=file]", output + "/invalid.json");
      assert.ok((await body()).includes("Import rejected"));
      assert.equal(JSON.stringify(await state()), before);
    },
  );
  await step("Browser runtime and network errors", async () => {
    const errors = page.events.filter(
      (e) => e.method === "Runtime.exceptionThrown",
    );
    assert.deepEqual(
      errors.map((e) => e.params.exceptionDetails.text),
      [],
    );
    const failed = page.events.filter(
      (e) =>
        e.method === "Network.responseReceived" &&
        e.params.response.status >= 400,
    );
    assert.deepEqual(
      failed.map((e) => [e.params.response.url, e.params.response.status]),
      [],
    );
  });
} catch (error) {
  results.push({ name: current, status: "failed", error: error.message });
  console.error("FAIL", current, error.message);
  const shot = await page.call("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(output + "/failure.png", Buffer.from(shot.data, "base64"));
  fs.writeFileSync(output + "/failure.txt", await body());
  process.exitCode = 1;
} finally {
  fs.writeFileSync(
    output + "/results.json",
    JSON.stringify({ base, results }, null, 2),
  );
  await browser.call("Target.disposeBrowserContext", { browserContextId });
  page.close();
  browser.close();
}
