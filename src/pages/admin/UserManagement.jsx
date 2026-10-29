import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "../../context/DemoContext";
import { Heading, Modal, Badge, Empty } from "../../components/UI";
import { id } from "../../services/domain";
import { isInternalRole } from "../../services/accessService";
export function UserManagement() {
  const d = useDemo(),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [company, setCompany] = useState("");
  const open = (u) => {
    setError("");
    setEditing(
      u
        ? { ...u, memberships: structuredClone(d.getMemberships(u)) }
        : {
            id: id(),
            name: "",
            email: "",
            password: "Demo@123",
            active: true,
            companyId: "",
            memberships: [],
          },
    );
  };
  const users = d.state.users
    .filter((u) => !isInternalRole(u.role))
    .filter(
      (u) =>
        (u.name + " " + u.email).toLowerCase().includes(query.toLowerCase()) &&
        (!company || d.getMemberships(u).some((m) => m.companyId === company)),
    );
  const changeMember = (cid, patch) =>
    setEditing({
      ...editing,
      memberships: editing.memberships.map((m) =>
        m.companyId === cid ? { ...m, ...patch } : m,
      ),
    });
  return (
    <>
      <Heading
        title={d.t("Users & company access")}
        eyebrow="CUSTOMER USER MANAGEMENT"
        action={
          <button className="primary" onClick={() => open()}>
            {d.t("Create user")}
          </button>
        }
      >
        {d.t(
          "Create customer logins and assign one or more companies with a role for each company.",
        )}
      </Heading>
      <div className="notice">
        {d.t(
          "Demo accounts and assignments are saved in this browser. No invitation email is sent.",
        )}{" "}
        {d.can("roles") && (
          <Link className="text-link" to="/admin/roles">
            {d.t("Manage internal staff & roles")} →
          </Link>
        )}
      </div>
      <section className="panel">
        <div className="filter-row">
          <input
            aria-label={d.t("Search users")}
            placeholder={d.t("Search name or email")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label={d.t("Filter by company")}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          >
            <option value="">{d.t("All companies")}</option>
            {d.state.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span>
            {users.length} {d.t("Users")}
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "User",
                  "Assigned companies & roles",
                  "Status",
                  "Actions",
                ].map((x) => (
                  <th key={x}>{d.t(x)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.name}</b>
                    <small>{u.email}</small>
                  </td>
                  <td className="user-company-list">
                    {d.getMemberships(u).map((m) => (
                      <div key={m.companyId}>
                        <b>
                          {
                            d.state.companies.find((c) => c.id === m.companyId)
                              ?.name
                          }
                        </b>
                        <small>
                          {d.t(
                            m.role === "buyer"
                              ? "Buyer"
                              : "Customer administrator",
                          )}{" "}
                          · {d.t(m.active ? "Active" : "Disabled")}
                          {!d.state.companies.find((c) => c.id === m.companyId)
                            ?.active
                            ? " · " + d.t("Company inactive")
                            : ""}
                        </small>
                      </div>
                    ))}
                  </td>
                  <td>
                    <Badge value={u.active ? "active" : "disabled"} />
                  </td>
                  <td>
                    <button
                      className="secondary compact"
                      onClick={() => open(u)}
                    >
                      {d.t("Edit user & companies")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users.length && <Empty>{d.t("No matching users")}</Empty>}
      </section>
      {editing && (
        <Modal
          title={d.t(
            d.state.users.some((u) => u.id === editing.id)
              ? "Edit user & companies"
              : "Create user",
          )}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                d.saveCustomer(editing);
                setEditing(null);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <div className="two-columns">
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
                    value={editing[key]}
                    onChange={(e) =>
                      setEditing({ ...editing, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) =>
                    setEditing({ ...editing, active: e.target.checked })
                  }
                />
                {d.t("Account active")}
              </label>
            </div>
            <h3>{d.t("Assign companies")}</h3>
            <p>
              {d.t(
                "Select all companies this user can access. Customer administrators can manage users and approve purchases within their assigned company.",
              )}
            </p>
            <div className="company-assignment-list">
              {d.state.companies.map((c) => {
                const m = editing.memberships.find((x) => x.companyId === c.id);
                return (
                  <div className="membership-row" key={c.id}>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        aria-label={"Assign " + c.name}
                        checked={!!m}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            memberships: e.target.checked
                              ? [
                                  ...editing.memberships,
                                  {
                                    companyId: c.id,
                                    role: "buyer",
                                    active: true,
                                  },
                                ]
                              : editing.memberships.filter(
                                  (x) => x.companyId !== c.id,
                                ),
                          })
                        }
                      />
                      <span>
                        {c.name}
                        <small>
                          {c.code}
                          {!c.active ? " · " + d.t("Company inactive") : ""}
                        </small>
                      </span>
                    </label>
                    {m && (
                      <div className="inline">
                        <select
                          aria-label={"Role " + c.name}
                          value={m.role}
                          onChange={(e) =>
                            changeMember(c.id, { role: e.target.value })
                          }
                        >
                          <option value="buyer">{d.t("Buyer")}</option>
                          <option value="customer_admin">
                            {d.t("Customer administrator")}
                          </option>
                        </select>
                        <label className="checkbox">
                          <input
                            aria-label={"Access active " + c.name}
                            type="checkbox"
                            checked={m.active}
                            onChange={(e) =>
                              changeMember(c.id, { active: e.target.checked })
                            }
                          />
                          {d.t("Access active")}
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {error && (
              <p className="error" role="alert">
                {d.t(error)}
              </p>
            )}
            <p className="notice">
              {editing.memberships.length} {d.t("companies assigned")}.{" "}
              {d.t(
                "Only active companies and active assignments appear after customer login.",
              )}
            </p>
            <div className="inline">
              <button className="primary">
                {d.t("Save user & assignments")}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                {d.t("Cancel")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
