import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = new URL(process.env.DEMO_BASE_URL ?? "http://localhost:3000");
const document = await readFile(new URL("../DEMO-ACCOUNTS.md", import.meta.url), "utf8");
const roles = { "Dean": "dean", "Head Laboratory / Admin": "headlab", "Faculty": "faculty", "Class Representative": "classrep", "Physics Laboratory Staff": "physics-staff", "Circuits Laboratory Staff": "circuits-staff" };
const credentials = document.split("\n").filter((line) => /^\| (Head Laboratory|Dean|Faculty|Class Representative|Physics Laboratory Staff|Circuits Laboratory Staff)/.test(line)).map((line) => {
  const [label, accountId, password, dashboard] = line.split("|").slice(1, -1).map((cell) => cell.trim().replaceAll("`", ""));
  return { label, accountId, password, dashboard, role: roles[label] };
});
assert.equal(credentials.length, 6, "Six documented demo logins are required.");
assert.deepEqual(new Set(credentials.map((account) => account.role)), new Set(Object.values(roles)));

const url = (path) => new URL(path, base);
const request = (path, options = {}) => fetch(url(path), { redirect: "manual", ...options });
const cookieFrom = (response) => {
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie?.includes("somada_demo_session="), "Login sets the demo session cookie.");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=lax/i);
  assert.match(cookie, /Max-Age=28800/i);
  return cookie.split(";")[0];
};
async function expectRedirect(response, path) {
  if ([303, 307, 308].includes(response.status)) assert.equal(new URL(response.headers.get("location"), base).pathname, path);
  else {
    // Next.js may send a meta redirect after a streaming response starts.
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes("NEXT_REDIRECT") && html.includes(path), "Streamed response redirects to the expected destination.");
  }
}
const login = (accountId, password, cookie) => request("/api/demo/login", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: base.origin, ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify({ accountId, password }),
});

function checkAccountMenu(html, profileHref) {
  assert.equal((html.match(/aria-label="Open account menu"/g) ?? []).length, 1, "Each dashboard has one account menu trigger.");
  assert.ok(/popovertarget="[^"]+"/i.test(html), "The account trigger targets its floating menu.");
  assert.ok(/popover="auto" role="menu"/.test(html), "The account options use a floating menu.");
  const profileLink = [...html.matchAll(/<a\b[^>]*>/g)].find(([tag]) => tag.includes(`href="${profileHref}"`) && tag.includes('role="menuitem"'));
  assert.ok(profileLink, "Profile opens the correct workspace destination.");
  assert.equal((html.match(/action="\/api\/demo\/logout"/g) ?? []).length, 1, "The shared account dropdown has one logout form.");
  for (const sidebar of html.matchAll(/<aside\b[^>]*>[\s\S]*?<\/aside>/g)) {
    assert.ok(!sidebar[0].includes(profileHref), "Profile is absent from the sidebar.");
    assert.ok(!sidebar[0].includes("/api/demo/logout"), "Logout is absent from the sidebar.");
  }
}

assert.equal((await request("/api/demo/session")).status, 401);
const invalid = await login(credentials[0].accountId, "wrong-password");
assert.equal(invalid.status, 401);
assert.equal(invalid.headers.get("set-cookie"), null);
assert.equal((await request("/api/demo/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{invalid" })).status, 400);

for (const account of credentials) {
  await expectRedirect(await request(account.dashboard), "/");
  const signedIn = await login(` ${account.accountId.toUpperCase()} `, account.password);
  assert.equal(signedIn.status, 200, account.label + " signs in.");
  assert.equal((await signedIn.json()).redirectTo, account.dashboard);
  let cookie = cookieFrom(signedIn);
  const session = await request("/api/demo/session", { headers: { Cookie: cookie } });
  assert.equal(session.status, 200, account.label + " session is recognized.");
  const sessionData = await session.json();
  assert.equal(sessionData.user.role, account.role);
  assert.equal(sessionData.user.accountId, account.accountId);
  assert.equal(sessionData.user.password, undefined);
  assert.match(session.headers.get("cache-control"), /no-store/);

  const dashboard = await request(account.dashboard, { headers: { Cookie: cookie } });
  assert.equal(dashboard.status, 200, account.label + " dashboard opens.");
  const html = await dashboard.text();
  const rolePath = account.dashboard.split("/")[2];
  checkAccountMenu(html, `/dashboard/${rolePath}/profile`);
  const profile = await request(`/dashboard/${rolePath}/profile`, { headers: { Cookie: cookie } });
  assert.equal(profile.status, 200, "Profile destination opens.");
  checkAccountMenu(await profile.text(), `/dashboard/${rolePath}/profile`);
  const titles = { dean: "Dean Dashboard", headlab: "Faculty Accounts", faculty: "Circuits Laboratory Faculty Dashboard", classrep: "Circuits Laboratory Representative Dashboard", "physics-staff": "Physics Laboratory", "circuits-staff": "Circuits Laboratory" };
  assert.ok(html.includes(titles[account.role]));
  assert.equal((await request(account.dashboard, { headers: { Cookie: cookie } })).status, 200, "Refresh retains the session.");
  const section = account.role === "headlab" ? "/dashboard/head-laboratory/overview" : (account.role === "dean" || account.role.endsWith("-staff")) ? `/dashboard/${rolePath}/profile` : `/dashboard/${account.role}/schedule`;
  const blankPage = await request(section, { headers: { Cookie: cookie } });
  assert.equal(blankPage.status, 200);
  assert.match(await blankPage.text(), /<main class="(?:(?:admin|lab)-blank-page|placeholder-profile-page)"/);
  for (const otherRole of credentials.filter((other) => other.role !== account.role)) {
    await expectRedirect(await request(otherRole.dashboard, { headers: { Cookie: cookie } }), account.dashboard);
    await expectRedirect(await request(`/dashboard/${otherRole.dashboard.split("/")[2]}/profile`, { headers: { Cookie: cookie } }), account.dashboard);
  }
  const directory = await request("/dashboard", { headers: { Cookie: cookie } });
  assert.equal(directory.status, 200);
  checkAccountMenu(await directory.text(), `/dashboard/${rolePath}/profile`);

  const crossOrigin = await request("/api/demo/logout", { method: "POST", headers: { Cookie: cookie, Origin: "https://example.invalid" } });
  assert.equal(crossOrigin.status, 403);
  assert.equal((await request("/api/demo/session", { headers: { Cookie: cookie } })).status, 200);

  const rotated = await login(account.accountId, account.password, cookie);
  assert.equal(rotated.status, 200);
  const newCookie = cookieFrom(rotated);
  assert.notEqual(newCookie, cookie, "Signing in rotates the session.");
  assert.equal((await request("/api/demo/session", { headers: { Cookie: cookie } })).status, 401, "The previous session is revoked.");
  cookie = newCookie;

  const loggedOut = await request("/api/demo/logout", { method: "POST", headers: { Cookie: cookie, Origin: base.origin } });
  assert.equal(loggedOut.status, 303);
  await expectRedirect(loggedOut, "/");
  assert.match(loggedOut.headers.get("set-cookie"), /Max-Age=0/i);
  assert.equal((await request("/api/demo/session", { headers: { Cookie: cookie } })).status, 401, "Logout revokes the server session.");
  await expectRedirect(await request(account.dashboard, { headers: { Cookie: cookie } }), "/");
  assert.equal((await request("/api/demo/logout", { method: "POST", headers: { Cookie: cookie, Origin: base.origin } })).status, 303, "Repeated logout is safe.");
  console.log(`${account.label}: account menu, Profile routes, login, refresh, role checks, session rotation, and logout checks passed.`);
}
assert.equal((await request("/")).status, 200);
console.log("All documented demo accounts passed. Login page remains available.");
