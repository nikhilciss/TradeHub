import React, { useState } from "react";
import { ShieldCheck, Users, Plus, LockKeyhole } from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { Heading, Modal, Badge, Empty } from "../../components/UI";
import {
  permissionCatalog,
  profileFor,
  profileIdFor,
} from "../../services/roleService";
import { id } from "../../services/domain";
export function RoleManagement() {
  const d = useDemo(),
    [tab, setTab] = useState("Roles & permissions"),
    [editing, setEditing] = useState(null),
    [account, setAccount] = useState(null),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState(null);
  const staff = d.state.users.filter((u) =>
    ["admin", "inside_sales", "field_sales"].includes(u.role),
  );
  const newRole = () => {
    setError("");
    setEditing({
      id: id(),
      name: "",
      description: "",
      active: true,
      system: false,
      permissions: ["dashboard"],
    });
  };
  const newAccount = () => {
    setError("");
    setAccount({
      id: id(),
      name: "",
      email: "",
      password: "Demo@123",
      role: "inside_sales",
      staffRoleId: "inside-sales",
      companyId: d.state.companies[0].id,
      active: true,
      memberships: [],
    });
  };
  return (
    <>
      <Heading
        title={d.t("Roles & permissions")}
        eyebrow="ACCESS MANAGEMENT"
        action={
          <button
            className="primary"
            onClick={tab === "Roles & permissions" ? newRole : newAccount}
            disabled={tab === "Staff accounts" && !d.can("users")}
          >
            <Plus size={16} />
            {d.t(
              tab === "Roles & permissions"
                ? "Create role"
                : "Add staff account",
            )}
          </button>
        }
      >
        {d.t("Control which internal modules each staff role can access.")}
      </Heading>
      <div className="notice">
        {d.t(
          "Demo permissions apply to navigation and page access in this browser. Production authorization must run on a server.",
        )}
      </div>
      <div className="tabs">
        {["Roles & permissions", "Staff accounts"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {d.t(t)}
          </button>
        ))}
      </div>
      {tab === "Roles & permissions" ? (
        <div className="role-cards">
          {d.state.roleProfiles.map((r) => (
            <section className="panel role-card" key={r.id}>
              <div className="section-title">
                <span className="role-icon">
                  <ShieldCheck size={22} />
                </span>
                <Badge value={r.active ? "active" : "disabled"} />
              </div>
              <h2>{r.name}</h2>
              <p>{r.description}</p>
              <small>
                {staff.filter((u) => profileIdFor(u) === r.id).length}{" "}
                {d.t("Assigned users")}
              </small>
              <div className="permission-tags">
                {permissionCatalog
                  .filter(([key]) => r.permissions.includes(key))
                  .map(([key, label]) => (
                    <span key={key}>{d.t(label)}</span>
                  ))}
              </div>
              <div className="inline">
                <button
                  className="secondary"
                  onClick={() => {
                    setError("");
                    setEditing(structuredClone(r));
                  }}
                >
                  {d.t(r.system ? "View permissions" : "Edit role")}
                </button>
                {!r.system && (
                  <button
                    className="text-link"
                    onClick={() => {
                      setError("");
                      setDeleting(r);
                    }}
                  >
                    {d.t("Delete")}
                  </button>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {["Name", "Email", "Role", "Status", "Actions"].map((x) => (
                    <th key={x}>{d.t(x)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.name}</b>
                    </td>
                    <td>{u.email}</td>
                    <td>{profileFor(d.state, u)?.name}</td>
                    <td>
                      <Badge value={u.active ? "active" : "disabled"} />
                    </td>
                    <td>
                      <button
                        disabled={!d.can("users")}
                        className="secondary compact"
                        onClick={() => {
                          setError("");
                          setAccount({ ...u, staffRoleId: profileIdFor(u) });
                        }}
                      >
                        {d.t("Edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {editing && (
        <Modal
          title={d.t(editing.system ? "View permissions" : "Edit role")}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                d.saveRole(editing);
                setEditing(null);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <label>
              {d.t("Role name")}
              <input
                required
                disabled={editing.system}
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label>
              {d.t("Description")}
              <textarea
                disabled={editing.system}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                disabled={editing.system}
                checked={editing.active}
                onChange={(e) =>
                  setEditing({ ...editing, active: e.target.checked })
                }
              />
              {d.t("Active")}
            </label>
            <h3>{d.t("Module permissions")}</h3>
            <div className="permission-grid">
              {permissionCatalog.map(([key, label]) => (
                <label className="checkbox" key={key}>
                  <input
                    type="checkbox"
                    disabled={editing.system}
                    checked={editing.permissions.includes(key)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        permissions: e.target.checked
                          ? [...editing.permissions, key]
                          : editing.permissions.filter((p) => p !== key),
                      })
                    }
                  />
                  {d.t(label)}
                </label>
              ))}
            </div>
            {editing.system && (
              <p className="notice">
                <LockKeyhole size={15} />{" "}
                {d.t(
                  "System administrator access is protected to prevent lockout.",
                )}
              </p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="inline">
              {!editing.system && (
                <button className="primary">{d.t("Save role")}</button>
              )}
              <button
                className="secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                {d.t("Close")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {account && (
        <Modal title={d.t("Staff account")} onClose={() => setAccount(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                d.saveStaff(account);
                setAccount(null);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            {[
              ["name", "Name"],
              ["email", "Email"],
              ["password", "Public demo password"],
            ].map(([key, label]) => (
              <label key={key}>
                {d.t(label)}
                <input
                  required
                  type={key === "email" ? "email" : "text"}
                  value={account[key]}
                  onChange={(e) =>
                    setAccount({ ...account, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              {d.t("Workspace type")}
              <select
                value={account.role}
                onChange={(e) =>
                  setAccount({
                    ...account,
                    role: e.target.value,
                    staffRoleId:
                      e.target.value === "field_sales"
                        ? "field-sales"
                        : e.target.value === "admin"
                          ? "system-admin"
                          : "inside-sales",
                  })
                }
              >
                <option value="admin">{d.t("System administrator")}</option>
                <option value="inside_sales">
                  {d.t("Internal operations")}
                </option>
                <option value="field_sales">{d.t("Field sales")}</option>
              </select>
            </label>
            <label>
              {d.t("Role")}
              <select
                value={account.staffRoleId}
                onChange={(e) =>
                  setAccount({ ...account, staffRoleId: e.target.value })
                }
              >
                {d.state.roleProfiles
                  .filter((r) => r.active || r.id === account.staffRoleId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={account.active}
                onChange={(e) =>
                  setAccount({ ...account, active: e.target.checked })
                }
              />
              {d.t("Active")}
            </label>
            <p className="notice">
              {d.t(
                "Use public demo credentials only. No invitation or email is sent.",
              )}
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary">{d.t("Save staff account")}</button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title={d.t("Delete role")} onClose={() => setDeleting(null)}>
          <h3>{deleting.name}</h3>
          <p>
            {d.t(
              "Assigned roles cannot be deleted. Reassign their users first.",
            )}
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="inline">
            <button
              className="danger"
              onClick={() => {
                try {
                  d.deleteRole(deleting.id);
                  setDeleting(null);
                } catch (err) {
                  setError(err.message);
                }
              }}
            >
              {d.t("Delete")}
            </button>
            <button className="secondary" onClick={() => setDeleting(null)}>
              {d.t("Cancel")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
