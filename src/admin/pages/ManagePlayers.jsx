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
  SelectField,
  CheckboxField,
} from "../components/AdminForm.jsx";
import { listTeams, listPlayers, createPlayer, updatePlayer, deletePlayer } from "../adminApi.js";

const ROLE_OPTS = [
  { value: "player", label: "Player" },
  { value: "sub", label: "Substitute" },
  { value: "coach", label: "Coach" },
];
const POS_OPTS = ["", "GK", "DEF", "MID", "FWD", "SUB"].map((p) => ({
  value: p,
  label: p || "—",
}));
const ROLE_COLOR = { player: "#6236FF", sub: "#00E5FF", coach: "#39FF14" };

export default function ManagePlayers() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const form = useForm({
    first: "",
    last: "",
    number: "",
    role: "player",
    pos: "",
    isCaptain: false,
    instagram: "",
    facebook: "",
  });

  useEffect(() => {
    listTeams()
      .then((t) => {
        setTeams(t);
        if (t.length) setTeamId((cur) => cur || t[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  const loadPlayers = useCallback(() => {
    if (!teamId) return;
    listPlayers(teamId)
      .then((p) => {
        setPlayers(p);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [teamId]);
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const openCreate = () => {
    setEditing(null);
    form.setValues({
      first: "",
      last: "",
      number: "",
      role: "player",
      pos: "",
      isCaptain: false,
      instagram: "",
      facebook: "",
    });
    setFormError("");
    setModal(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    form.setValues({
      first: p.first,
      last: p.last,
      number: p.number ?? "",
      role: p.role || "player",
      pos: p.pos || "",
      isCaptain: Boolean(p.isCaptain),
      instagram: p.instagram || "",
      facebook: p.facebook || "",
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
      const body = {
        teamId,
        first: v.first,
        last: v.last,
        role: v.role,
        pos: v.pos,
        number: v.number === "" ? null : Number(v.number),
        isCaptain: v.isCaptain,
        instagram: v.instagram,
        facebook: v.facebook,
      };
      if (editing) await updatePlayer(editing.id, body);
      else await createPlayer(body);
      setModal(false);
      loadPlayers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deletePlayer(confirm.id);
      setConfirm(null);
      loadPlayers();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  return (
    <div>
      <AdminPageHeader title="Players" actionLabel="Add player" onAction={teamId ? openCreate : undefined} />

      <div className="mb-4">
        <SelectField
          label="Team"
          options={teamOptions.length ? teamOptions : [{ value: "", label: "— no teams —" }]}
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        />
      </div>

      <ErrorNote>{error}</ErrorNote>

      {!players ? (
        <Spinner />
      ) : players.length === 0 ? (
        <EmptyState>No players for this team yet</EmptyState>
      ) : (
        <div className="space-y-3">
          {players.map((p) => (
            <AdminRow
              key={p.id}
              title={`${p.first} ${p.last}`}
              meta={[
                p.number != null ? `#${p.number}` : null,
                p.pos || null,
                p.goals ? `${p.goals} goals` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              badges={
                <>
                  <Pill color={ROLE_COLOR[p.role] || "#6236FF"}>{p.role}</Pill>
                  {p.isCaptain && <Pill color="#FFC700">Captain</Pill>}
                </>
              }
              onEdit={() => openEdit(p)}
              onDelete={() => setConfirm(p)}
            />
          ))}
        </div>
      )}

      {modal && (
        <AdminModal
          title={editing ? "Edit player" : "Add player"}
          onClose={() => setModal(false)}
          onSubmit={submit}
          busy={busy}
          error={formError}
          submitLabel={editing ? "Save" : "Create"}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField label="First name" required {...form.bind("first")} />
            <TextField label="Last name" required {...form.bind("last")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Role" options={ROLE_OPTS} {...form.bind("role")} />
            <SelectField label="Position" options={POS_OPTS} {...form.bind("pos")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Shirt number" {...form.bind("number")} />
            <label className="block">
              <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Goals
              </span>
              <div className="auth-input flex items-center !cursor-default text-gray-300">
                {editing ? (editing.goals ?? 0) : 0}
              </div>
              <span className="mt-1 block font-mono text-[10px] text-gray-500">
                Set automatically from match scorers
              </span>
            </label>
          </div>
          <CheckboxField label="Team captain" {...form.bindCheck("isCaptain")} />
          <TextField label="Instagram URL" {...form.bind("instagram")} />
          <TextField label="Facebook URL" {...form.bind("facebook")} />
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete player"
        message={confirm ? `Delete ${confirm.first} ${confirm.last}?` : ""}
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
