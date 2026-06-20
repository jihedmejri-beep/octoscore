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
import {
  AdminModal,
  useForm,
  TextField,
  NumberField,
  TextAreaField,
  SelectField,
} from "../components/AdminForm.jsx";
import { listGallery, createGallery, updateGallery, deleteGallery } from "../adminApi.js";

const ACCENT_OPTS = [
  { value: "purple", label: "Purple" },
  { value: "green", label: "Green" },
  { value: "cyan", label: "Cyan" },
  { value: "gold", label: "Gold" },
];
const ACCENT_HEX = { purple: "#6236FF", green: "#39FF14", cyan: "#00E5FF", gold: "#FFC700" };

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export default function ManageGallery() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [file, setFile] = useState(null);

  const form = useForm({ title: "", tag: "", caption: "", accent: "purple", date: "", order: "" });

  const load = useCallback(() => {
    listGallery()
      .then((d) => {
        setItems(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFile(null);
    form.setValues({ title: "", tag: "", caption: "", accent: "purple", date: "", order: "" });
    setFormError("");
    setModal(true);
  };
  const openEdit = (it) => {
    setEditing(it);
    setFile(null);
    form.setValues({
      title: it.title,
      tag: it.tag || "",
      caption: it.caption || "",
      accent: it.accent || "purple",
      date: toDateInput(it.date),
      order: it.order ?? "",
    });
    setFormError("");
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const v = form.values;
      const fd = new FormData();
      fd.append("title", v.title);
      fd.append("tag", v.tag);
      fd.append("caption", v.caption);
      fd.append("accent", v.accent);
      if (v.date) fd.append("date", v.date);
      if (v.order !== "") fd.append("order", v.order);
      if (file) fd.append("image", file);

      if (editing) await updateGallery(editing.id, fd);
      else await createGallery(fd);
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
      await deleteGallery(confirm.id);
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
        title="Gallery"
        subtitle={items ? `${items.length} memories` : ""}
        actionLabel="Add memory"
        onAction={openCreate}
      />
      <ErrorNote>{error}</ErrorNote>

      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState>No memories yet</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <AdminRow
              key={it.id}
              title={it.title}
              meta={[it.tag, it.date ? new Date(it.date).toLocaleDateString() : null].filter(Boolean).join(" · ")}
              badges={!it.image?.url && <Pill color={ACCENT_HEX[it.accent]}>no photo</Pill>}
              leading={
                <div
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10"
                  style={{ backgroundColor: `${ACCENT_HEX[it.accent]}22` }}
                >
                  {it.image?.url && (
                    <img src={it.image.url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              }
              onEdit={() => openEdit(it)}
              onDelete={() => setConfirm(it)}
            />
          ))}
        </div>
      )}

      {modal && (
        <AdminModal
          title={editing ? "Edit memory" : "Add memory"}
          onClose={() => setModal(false)}
          onSubmit={submit}
          busy={busy}
          error={formError}
          submitLabel={editing ? "Save" : "Create"}
        >
          <TextField label="Title" required {...form.bind("title")} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Tag" placeholder="Ceremony" {...form.bind("tag")} />
            <SelectField label="Accent" options={ACCENT_OPTS} {...form.bind("accent")} />
          </div>
          <TextAreaField label="Caption" {...form.bind("caption")} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Date" type="date" {...form.bind("date")} />
            <NumberField label="Order" {...form.bind("order")} />
          </div>

          <div>
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Photo {editing ? "(leave empty to keep current)" : "(optional)"}
            </span>
            {editing?.image?.url && !file && (
              <img
                src={editing.image.url}
                alt=""
                className="mb-2 h-28 w-full rounded-xl border border-white/10 object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-octo-purple file:px-4 file:py-2 file:font-display file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-white hover:file:opacity-90"
            />
            <p className="mt-1 font-mono text-[10px] text-gray-500">
              Uploads to Cloudinary. Needs the server's Cloudinary keys configured.
            </p>
          </div>
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete memory"
        message={confirm ? `Delete "${confirm.title}"? The Cloudinary image is removed too.` : ""}
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
