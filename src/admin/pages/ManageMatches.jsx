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
} from "../components/AdminForm.jsx";
import {
  listMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  listTeams,
  listGroups,
  listPlayers,
} from "../adminApi.js";
import { liveMinuteNow } from "../../hooks/useLiveClock.js";

const STATUS_OPTS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];
const LEG_OPTS = [
  { value: "", label: "—" },
  { value: "home_leg", label: "Home leg" },
  { value: "away_leg", label: "Away leg" },
  { value: "final", label: "Final" },
];
const STATUS_COLOR = { upcoming: "#9ca3af", live: "#39FF14", finished: "#6236FF" };

// <input type="datetime-local"> works in local time; convert to/from ISO.
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (val) => (val ? new Date(val).toISOString() : null);

export default function ManageMatches() {
  const [matches, setMatches] = useState(null);
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [players, setPlayers] = useState([]);
  const [scorers, setScorers] = useState([]); // [{ playerId, goals }]
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm, setConfirm] = useState(null);

  const form = useForm({
    homeTeamId: "",
    awayTeamId: "",
    group: "",
    round: "",
    leg: "",
    status: "upcoming",
    minute: "",
    homeScore: "",
    awayScore: "",
    date: "",
    location: "",
    liveLink: "",
  });

  const load = useCallback(() => {
    Promise.all([listMatches(), listTeams(), listGroups(), listPlayers()])
      .then(([m, t, g, p]) => {
        setMatches(m);
        setTeams(t);
        setGroups(g);
        setPlayers(p);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const teamName = (id) => teams.find((t) => t.id === id)?.name || id;
  const teamOptions = [{ value: "", label: "— select —" }, ...teams.map((t) => ({ value: t.id, label: t.name }))];
  const groupOptions = [
    ...groups.map((g) => ({ value: g.id, label: `${g.id} — ${g.name}` })),
    { value: "FINAL", label: "Final" },
  ];

  const openCreate = () => {
    setEditing(null);
    setScorers([]);
    form.setValues({
      homeTeamId: "",
      awayTeamId: "",
      group: groups[0]?.id || "",
      round: "",
      leg: "",
      status: "upcoming",
      minute: "",
      homeScore: "",
      awayScore: "",
      date: "",
      location: "",
      liveLink: "",
    });
    setFormError("");
    setModal(true);
  };
  const openEdit = (m) => {
    setEditing(m);
    setScorers(
      (m.scorers || []).map((s) => ({
        playerId: s.playerId,
        goals: s.goals ?? 1,
        minute: s.minute ?? "",
      }))
    );
    form.setValues({
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      group: m.group,
      round: m.round || "",
      leg: m.leg || "",
      status: m.status,
      minute: m.minute ?? "",
      homeScore: m.homeScore ?? "",
      awayScore: m.awayScore ?? "",
      date: toLocalInput(m.date),
      location: m.location || "",
      liveLink: m.liveLink || "",
    });
    setFormError("");
    setModal(true);
  };

  // Players eligible to be scorers = members of the two selected teams.
  const eligiblePlayers = players.filter(
    (p) => p.teamId === form.values.homeTeamId || p.teamId === form.values.awayTeamId
  );
  const scorerOptions = [
    { value: "", label: "— select player —" },
    ...eligiblePlayers.map((p) => ({
      value: p.id,
      label: `${p.first} ${p.last} · ${teamName(p.teamId)}`,
    })),
  ];
  // New goals on a live match are stamped with the current clock minute
  // (editable afterwards, e.g. to log a goal you entered late).
  const addScorer = () => {
    const auto =
      form.values.status === "live" ? liveMinuteNow(editing?.kickoffAt) : null;
    setScorers((s) => [...s, { playerId: "", goals: 1, minute: auto ?? "" }]);
  };
  const setScorer = (i, patch) =>
    setScorers((s) => s.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeScorer = (i) => setScorers((s) => s.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    const v = form.values;
    if (v.homeTeamId && v.homeTeamId === v.awayTeamId) {
      setFormError("Home and away teams must differ");
      setBusy(false);
      return;
    }
    try {
      const body = {
        homeTeamId: v.homeTeamId,
        awayTeamId: v.awayTeamId,
        group: v.group,
        round: v.round,
        leg: v.leg,
        status: v.status,
        minute: v.minute === "" ? null : Number(v.minute),
        homeScore: v.homeScore === "" ? null : Number(v.homeScore),
        awayScore: v.awayScore === "" ? null : Number(v.awayScore),
        date: fromLocalInput(v.date),
        location: v.location,
        liveLink: v.liveLink || null,
        scorers: scorers
          .filter((s) => s.playerId)
          .map((s) => ({
            playerId: s.playerId,
            goals: Math.max(1, Number(s.goals) || 1),
            minute:
              s.minute === "" || s.minute === null || s.minute === undefined
                ? null
                : Math.min(120, Math.max(0, Number(s.minute) || 0)),
          })),
      };
      if (editing) await updateMatch(editing.id, body);
      else await createMatch(body);
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
      await deleteMatch(confirm.id);
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
        title="Matches"
        subtitle={matches ? `${matches.length} matches` : ""}
        actionLabel="Add match"
        onAction={openCreate}
      />
      <ErrorNote>{error}</ErrorNote>

      {!matches ? (
        <Spinner />
      ) : matches.length === 0 ? (
        <EmptyState>No matches yet</EmptyState>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const played = m.status !== "upcoming";
            return (
              <AdminRow
                key={m.id}
                title={`${teamName(m.homeTeamId)} ${played ? `${m.homeScore} - ${m.awayScore}` : "vs"} ${teamName(m.awayTeamId)}`}
                meta={[m.round, m.location, m.date ? new Date(m.date).toLocaleString() : null]
                  .filter(Boolean)
                  .join(" · ")}
                badges={
                  <>
                    <Pill color={STATUS_COLOR[m.status]}>{m.status}</Pill>
                    <Pill color="#FFC700">{m.group}</Pill>
                  </>
                }
                onEdit={() => openEdit(m)}
                onDelete={() => setConfirm(m)}
              />
            );
          })}
        </div>
      )}

      {modal && (
        <AdminModal
          title={editing ? "Edit match" : "Add match"}
          onClose={() => setModal(false)}
          onSubmit={submit}
          busy={busy}
          error={formError}
          submitLabel={editing ? "Save" : "Create"}
        >
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Home team" required options={teamOptions} {...form.bind("homeTeamId")} />
            <SelectField label="Away team" required options={teamOptions} {...form.bind("awayTeamId")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Group" options={groupOptions} {...form.bind("group")} />
            <SelectField label="Status" options={STATUS_OPTS} {...form.bind("status")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Round" placeholder="QF / SF / FINAL" {...form.bind("round")} />
            <SelectField label="Leg" options={LEG_OPTS} {...form.bind("leg")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Home score" {...form.bind("homeScore")} />
            <NumberField label="Away score" {...form.bind("awayScore")} />
            <NumberField label="Minute" {...form.bind("minute")} />
          </div>
          <TextField label="Kickoff" type="datetime-local" {...form.bind("date")} />
          <TextField label="Location" {...form.bind("location")} />
          <TextField label="Live stream URL" {...form.bind("liveLink")} />

          {/* Goal scorers — drives the goal balls shown next to players in the lineup. */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Goal scorers
              </span>
              <button
                type="button"
                onClick={addScorer}
                disabled={!form.values.homeTeamId || !form.values.awayTeamId}
                className="rounded-full border border-white/10 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-gray-300 transition-colors hover:text-white disabled:opacity-40"
              >
                + Add scorer
              </button>
            </div>

            {!form.values.homeTeamId || !form.values.awayTeamId ? (
              <p className="font-mono text-[10px] text-gray-500">Pick both teams first.</p>
            ) : scorers.length === 0 ? (
              <p className="font-mono text-[10px] text-gray-500">
                No scorers yet — add one for each player who scored.
              </p>
            ) : (
              <div className="space-y-2">
                {scorers.map((s, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <SelectField
                        label={`Scorer ${i + 1}`}
                        options={scorerOptions}
                        value={s.playerId}
                        onChange={(e) => setScorer(i, { playerId: e.target.value })}
                      />
                    </div>
                    <div className="w-16">
                      <NumberField
                        label="Goals"
                        min="1"
                        value={s.goals}
                        onChange={(e) => setScorer(i, { goals: e.target.value })}
                      />
                    </div>
                    <div className="w-16">
                      <NumberField
                        label="Min"
                        min="0"
                        max="120"
                        value={s.minute}
                        onChange={(e) => setScorer(i, { minute: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScorer(i)}
                      aria-label="Remove scorer"
                      className="mb-0.5 grid h-[42px] w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-gray-400 transition-colors hover:border-red-500/40 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminModal>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete match"
        message={confirm ? `Delete ${teamName(confirm.homeTeamId)} vs ${teamName(confirm.awayTeamId)}?` : ""}
        busy={busy}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
