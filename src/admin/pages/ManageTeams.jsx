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
import { AdminModal, useForm, TextField, SelectField } from "../components/AdminForm.jsx";
import {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  listGroups,
  listTeamPhotos,
  uploadTeamPhotos,
  deleteTeamPhoto,
} from "../adminApi.js";

const GROUP_COLORS = { A: "#6236FF", B: "#00E5FF", FINAL: "#FFC700" };

export default function ManageTeams() {
  const [teams, setTeams] = useState(null);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [logo, setLogo] = useState(null);

  // Album state for the team being edited.
  const [photos, setPhotos] = useState([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const form = useForm({ name: "", group: "", city: "", color: "" });

  const load = useCallback(() => {
    Promise.all([listTeams(), listGroups()])
      .then(([t, g]) => {
        setTeams(t);
        setGroups(g);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const groupOptions = groups.map((g) => ({ value: g.id, label: `${g.id} — ${g.name}` }));

  const openCreate = () => {
    setEditing(null);
    setLogo(null);
    setPhotos([]);
    setPhotoError("");
    form.setValues({ name: "", group: groups[0]?.id || "", city: "", color: "" });
    setFormError("");
    setModal(true);
  };
  const openEdit = (team) => {
    setEditing(team);
    setLogo(null);
    setPhotoError("");
    form.setValues({ name: team.name, group: team.group, city: team.city || "", color: team.color || "" });
    setFormError("");
    setModal(true);
    // Load the team's album.
    setPhotos([]);
    listTeamPhotos(team.id).then(setPhotos).catch(() => setPhotos([]));
  };

  // Upload one or more album photos immediately (independent of the team form).
  const addPhotos = async (files) => {
    if (!editing || !files?.length) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const fd = new FormData();
      [...files].forEach((f) => fd.append("photos", f));
      const created = await uploadTeamPhotos(editing.id, fd);
      setPhotos((prev) => [...prev, ...created]);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async (photoId) => {
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await deleteTeamPhoto(editing.id, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    // A logo is mandatory when first creating a team.
    if (!editing && !logo) {
      setFormError("A team logo is required.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const v = form.values;
      const fd = new FormData();
      fd.append("name", v.name);
      fd.append("group", v.group);
      fd.append("city", v.city);
      fd.append("color", v.color);
      if (logo) fd.append("logo", logo);

      if (editing) await updateTeam(editing.id, fd);
      else await createTeam(fd);
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
      await deleteTeam(confirm.id);
      setConfirm(null);
      load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const missingLogos = teams ? teams.filter((t) => !t.logo?.url).length : 0;

  return (
    <div>
      <AdminPageHeader
        title="Teams"
        subtitle={teams ? `${teams.length} teams` : ""}
        actionLabel="Add team"
        onAction={openCreate}
      />
      <ErrorNote>{error}</ErrorNote>

      {missingLogos > 0 && (
        <p className="mb-4 rounded-xl border border-octo-gold/30 bg-octo-gold/10 px-3 py-2 font-mono text-xs text-octo-gold">
          {missingLogos} team{missingLogos > 1 ? "s are" : " is"} missing a logo — edit{" "}
          {missingLogos > 1 ? "them" : "it"} to add one.
        </p>
      )}

      {!teams ? (
        <Spinner />
      ) : teams.length === 0 ? (
        <EmptyState>No teams yet — add one</EmptyState>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <AdminRow
              key={team.id}
              title={team.name}
              meta={team.city || "—"}
              leading={
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-octo-elevated">
                  {team.logo?.url ? (
                    <img src={team.logo.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-[10px] font-bold uppercase text-gray-500">
                      no logo
                    </span>
                  )}
                </div>
              }
              badges={
                <>
                  <Pill color={GROUP_COLORS[team.group] || "#6236FF"}>
                    {groups.find((g) => g.id === team.group)?.name || team.group}
                  </Pill>
                  {!team.logo?.url && <Pill color="#FFC700">no logo</Pill>}
                </>
              }
              onEdit={() => openEdit(team)}
              onDelete={() => setConfirm(team)}
            />
          ))}
        </div>
      )}

      {modal && (
        <AdminModal
          title={editing ? "Edit team" : "Add team"}
          onClose={() => setModal(false)}
          onSubmit={submit}
          busy={busy}
          error={formError}
          submitLabel={editing ? "Save" : "Create"}
        >
          <TextField label="Name" required {...form.bind("name")} />
          <SelectField
            label="Group"
            required
            options={groupOptions.length ? groupOptions : [{ value: "", label: "— create a group first —" }]}
            {...form.bind("group")}
          />
          <TextField label="City" {...form.bind("city")} />
          <TextField label="Accent color (hex, optional)" placeholder="#6236FF" {...form.bind("color")} />

          <div>
            <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Logo {editing ? "(leave empty to keep current)" : "(required)"}
            </span>
            {(logo || editing?.logo?.url) && (
              <img
                src={logo ? URL.createObjectURL(logo) : editing.logo.url}
                alt=""
                className="mb-2 h-20 w-20 rounded-xl border border-white/10 object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-octo-purple file:px-4 file:py-2 file:font-display file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-white hover:file:opacity-90"
            />
            <p className="mt-1 font-mono text-[10px] text-gray-500">
              Square image works best. Uploads to Cloudinary (server keys required).
            </p>
          </div>

          {/* Photo album — only after the team exists (needs its id). */}
          {editing ? (
            <div className="border-t border-white/5 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Album ({photos.length})
                </span>
                <label className="cursor-pointer rounded-full bg-octo-purple px-4 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90">
                  {photoBusy ? "Uploading…" : "+ Add photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={photoBusy}
                    onChange={(e) => {
                      addPhotos(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {photoError && (
                <p className="mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-300">
                  {photoError}
                </p>
              )}

              {photos.length === 0 ? (
                <p className="font-mono text-[10px] text-gray-500">
                  No photos yet — add as many as you like. Fans can view and download them.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-octo-elevated">
                      <img src={p.thumbUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        disabled={photoBusy}
                        aria-label="Delete photo"
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-500/80 group-hover:opacity-100 disabled:opacity-40"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="border-t border-white/5 pt-4 font-mono text-[10px] text-gray-500">
              Create the team first, then edit it to add a photo album.
            </p>
          )}
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete team"
        message={confirm ? `Delete "${confirm.name}" and all its players? This cannot be undone.` : ""}
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
