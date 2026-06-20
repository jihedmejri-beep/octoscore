import { useCallback, useEffect, useState } from "react";

import {
  AdminPageHeader,
  AdminRow,
  Spinner,
  EmptyState,
  ErrorNote,
  ConfirmDialog,
  Pill,
} from "../components/AdminTable.jsx";
import { AdminModal, useForm, TextField, NumberField } from "../components/AdminForm.jsx";
import { listGroups, createGroup, updateGroup, deleteGroup } from "../adminApi.js";

export default function ManageGroups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const form = useForm({ id: "", name: "", city: "", order: "" });

  const load = useCallback(() => {
    listGroups()
      .then((d) => {
        setGroups(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.setValues({ id: "", name: "", city: "", order: "" });
    setFormError("");
    setModal(true);
  };
  const openEdit = (g) => {
    setEditing(g);
    form.setValues({ id: g.id, name: g.name, city: g.city || "", order: g.order ?? "" });
    setFormError("");
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const v = form.values;
      const order = v.order === "" ? 0 : Number(v.order);
      if (editing) {
        await updateGroup(editing.id, { name: v.name, city: v.city, order });
      } else {
        await createGroup({ _id: v.id.trim(), name: v.name, city: v.city, order });
      }
      setModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteGroup(confirm.id);
      setConfirm(null);
      load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Groups"
        subtitle={groups ? `${groups.length} groups` : ""}
        actionLabel="Add group"
        onAction={openCreate}
      />
      <ErrorNote>{error}</ErrorNote>

      {!groups ? (
        <Spinner />
      ) : groups.length === 0 ? (
        <EmptyState>No groups yet</EmptyState>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <AdminRow
              key={g.id}
              title={g.name}
              meta={g.city || "—"}
              badges={<Pill>{g.id}</Pill>}
              onEdit={() => openEdit(g)}
              onDelete={() => setConfirm(g)}
            />
          ))}
        </div>
      )}

      {modal && (
        <AdminModal
          title={editing ? "Edit group" : "Add group"}
          onClose={() => setModal(false)}
          onSubmit={submit}
          busy={busy}
          error={formError}
          submitLabel={editing ? "Save" : "Create"}
        >
          {!editing && (
            <TextField label="Group ID" required placeholder="A, B, C…" hint="Short code used by teams & matches" {...form.bind("id")} />
          )}
          <TextField label="Name" required placeholder="Sousse" {...form.bind("name")} />
          <TextField label="City" {...form.bind("city")} />
          <NumberField label="Order" {...form.bind("order")} />
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete group"
        message={confirm ? `Delete group "${confirm.name}"? Teams keep their group code.` : ""}
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
