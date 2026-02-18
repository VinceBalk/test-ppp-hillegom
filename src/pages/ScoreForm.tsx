// src/pages/ScoreForm.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tournament {
  id: string;
  name: string;
  start_date: string;
}

interface Court {
  id: string;
  name: string;
  menu_order: number;
  is_active: boolean;
  row_side: string;
}

interface MatchRow {
  id: string;
  match_number: number;
  round_number: number;
  court_id: string | null;
  court_name: string;
  court_menu_order: number;
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
}

// Single static special column — totaal aantal specials per speler
const SPECIALS_COLUMN = [{ id: "specials", name: "Specials" }];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Print CSS ────────────────────────────────────────────────────────────────

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 12mm 12mm; }
  body * { visibility: hidden; }
  #scoreform-print, #scoreform-print * { visibility: visible; }
  #scoreform-print { position: absolute; inset: 0; }
  .sf-no-print { display: none !important; }
  .sf-page {
    page-break-after: always;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 4px 8px !important;
    zoom: 0.9;
  }
  .sf-page:last-child { page-break-after: auto; }
  .sf-match { page-break-inside: avoid; }
}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader({
  tournament,
  roundLabel,
  courtName,
}: {
  tournament: Tournament;
  roundLabel: string;
  courtName: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "3px solid #f28b00",
        paddingBottom: 10,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src="/PPP_logo.webp"
          alt="PPP Hillegom"
          style={{ height: 54, width: "auto", display: "block" }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            const fb = el.nextElementSibling as HTMLElement;
            if (fb) fb.style.display = "flex";
          }}
        />
        <div
          style={{
            display: "none",
            width: 54,
            height: 54,
            background: "linear-gradient(135deg,#f28b00,#fbbf24)",
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            color: "white",
          }}
        >
          🎾
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>
            PPP Hillegom
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
            {tournament.name} · {formatDate(tournament.start_date)}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#f28b00", lineHeight: 1 }}>
          {roundLabel}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginTop: 4 }}>
          {courtName}
        </div>
      </div>
    </div>
  );
}

function MatchBlock({
  matchNumber,
  team1p1,
  team1p2,
  team2p1,
  team2p2,
  specials,
  blank = false,
}: {
  matchNumber: number;
  team1p1: string;
  team1p2: string;
  team2p1: string;
  team2p2: string;
  specials: { id: string; name: string }[];
  blank?: boolean;
}) {
  const tdBase: React.CSSProperties = {
    padding: "7px 10px",
    fontSize: 12,
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "middle",
  };

  const teamBadge = (color: string, bg: string): React.CSSProperties => ({
    ...tdBase,
    width: 54,
    textAlign: "center",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".04em",
    background: bg,
    color,
    borderRight: "1px solid #e5e7eb",
  });

  const scoreCell: React.CSSProperties = {
    ...tdBase,
    width: 70,
    textAlign: "center",
    background: "#fffbeb",
    borderLeft: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
  };

  const specialCell: React.CSSProperties = {
    ...tdBase,
    width: 70,
    textAlign: "center",
    background: "#fafafa",
    verticalAlign: "bottom",
    paddingBottom: 6,
  };

  const blankName = (
    <span style={{ color: "#e5e7eb" }}>________________________</span>
  );

  const specialCols = specials.map((sp) => (
    <td key={sp.id} style={specialCell}>
      <div style={{ display: "inline-block", width: 36, borderBottom: "1.5px solid #9ca3af", height: 20 }} />
    </td>
  ));

  const scoreBox = (
    <div style={{ display: "inline-block", width: 44, height: 26, border: "1.5px solid #374151", borderRadius: 3 }} />
  );

  const dividerStyle: React.CSSProperties = {
    height: 3,
    background: "#f9fafb",
    borderTop: "1px dashed #e5e7eb",
    borderBottom: "1px dashed #e5e7eb",
    padding: 0,
  };

  const thStyle: React.CSSProperties = {
    background: "#f3f4f6",
    fontSize: 9,
    fontWeight: 800,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: ".05em",
    padding: "4px 10px",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center",
  };

  return (
    <div
      className="sf-match"
      style={{ border: "1px solid #d1d5db", borderRadius: 5, overflow: "hidden", marginBottom: 10 }}
    >
      <div style={{ background: blank ? "#f3f4f6" : "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "5px 10px" }}>
        <span style={{
          background: blank ? "#9ca3af" : "#f28b00",
          color: "white", fontSize: 10, fontWeight: 800,
          borderRadius: 4, padding: "2px 9px", display: "inline-block", letterSpacing: ".04em",
        }}>
          WEDSTRIJD {matchNumber}
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 54 }}>Team</th>
            <th style={{ ...thStyle, textAlign: "left" }}>Speler</th>
            <th style={{ ...thStyle, width: 70 }}>Score</th>
            {specials.map((sp) => (
              <th key={sp.id} style={{ ...thStyle, width: 70 }}>{sp.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={teamBadge("#1d4ed8", "#eff6ff")} rowSpan={2}>TEAM 1</td>
            <td style={tdBase}>{blank ? blankName : team1p1}</td>
            <td style={scoreCell} rowSpan={2}>{scoreBox}</td>
            {specialCols}
          </tr>
          <tr>
            <td style={{ ...tdBase, borderBottom: "none" }}>{blank ? blankName : team1p2}</td>
            {specialCols}
          </tr>
          <tr>
            <td colSpan={3 + specials.length} style={dividerStyle} />
          </tr>
          <tr>
            <td style={teamBadge("#15803d", "#f0fdf4")} rowSpan={2}>TEAM 2</td>
            <td style={tdBase}>{blank ? blankName : team2p1}</td>
            <td style={scoreCell} rowSpan={2}>{scoreBox}</td>
            {specialCols}
          </tr>
          <tr>
            <td style={{ ...tdBase, borderBottom: "none" }}>{blank ? blankName : team2p2}</td>
            {specialCols}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PageFooter({ tournament, courtName, roundLabel }: { tournament: Tournament; courtName: string; roundLabel: string }) {
  return (
    <div style={{ marginTop: 10, paddingTop: 6, borderTop: "1px solid #f0f0f0", fontSize: 8, color: "#c0c0c0", textAlign: "center" }}>
      PPP Hillegom · {tournament.name} · {courtName} · {roundLabel} · Scores verwerken via de app — dit formulier is alleen voor papieren invoer op locatie
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
// BELANGRIJK: ALLE hooks staan vóór enige conditional return — React rules of hooks

export default function ScoreForm() {
  const { hasRole } = useAuth();

  // ── State (altijd, onvoorwaardelijk) ──────────────────────────────────────
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("1");
  const [loading, setLoading] = useState(false);

  // ── Effects (altijd, onvoorwaardelijk) ───────────────────────────────────
  useEffect(() => {
    loadTournaments();
    loadCourts();
  }, []);

  useEffect(() => {
    if (selectedTournamentId && selectedRound !== "3") {
      loadMatches();
    } else {
      setMatches([]);
    }
  }, [selectedTournamentId, selectedRound]);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  async function loadTournaments() {
    const { data } = await supabase
      .from("tournaments")
      .select("id, name, start_date")
      .order("start_date", { ascending: false });
    setTournaments((data as Tournament[]) || []);
  }

  async function loadCourts() {
    const { data } = await supabase
      .from("courts")
      .select("id, name, menu_order, is_active, row_side")
      .eq("is_active", true)
      .order("menu_order", { ascending: true });
    setCourts((data as Court[]) || []);
  }

  async function loadMatches() {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id,
        match_number,
        round_number,
        court_id,
        court:courts(name, menu_order),
        team1_player1:players!matches_team1_player1_id_fkey(name),
        team1_player2:players!matches_team1_player2_id_fkey(name),
        team2_player1:players!matches_team2_player1_id_fkey(name),
        team2_player2:players!matches_team2_player2_id_fkey(name)
      `)
      .eq("tournament_id", selectedTournamentId)
      .eq("round_number", parseInt(selectedRound))
      .order("match_number", { ascending: true });

    if (!error && data) {
      const mapped: MatchRow[] = (data as any[]).map((m) => ({
        id: m.id,
        match_number: m.match_number,
        round_number: m.round_number,
        court_id: m.court_id,
        court_name: m.court?.name ?? `Baan ${m.court_number ?? "?"}`,
        court_menu_order: m.court?.menu_order ?? 999,
        team1_player1: m.team1_player1?.name ?? "–",
        team1_player2: m.team1_player2?.name ?? "–",
        team2_player1: m.team2_player1?.name ?? "–",
        team2_player2: m.team2_player2?.name ?? "–",
      }));
      setMatches(mapped);
    }
    setLoading(false);
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);

  const matchesByCourt: Record<string, MatchRow[]> = {};
  for (const m of matches) {
    if (!matchesByCourt[m.court_name]) matchesByCourt[m.court_name] = [];
    matchesByCourt[m.court_name].push(m);
  }
  const sortedCourtNames = Object.keys(matchesByCourt).sort((a, b) => {
    const ao = matchesByCourt[a][0]?.court_menu_order ?? 999;
    const bo = matchesByCourt[b][0]?.court_menu_order ?? 999;
    return ao - bo;
  });

  const roundLabel = selectedRound === "3" ? "RONDE 3" : `RONDE ${selectedRound}`;
  const canPrint = selectedTournament && (selectedRound === "3" ? courts.length > 0 : matches.length > 0);

  // ── Access guard — NA alle hooks, IN de render ────────────────────────────
  if (!hasRole("organisator")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Toegang geweigerd</h3>
            <p className="text-muted-foreground">
              Alleen organisatoren en beheerders kunnen scoreformulieren aanmaken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{PRINT_CSS}</style>

      {/* Controls (niet printen) */}
      <div className="sf-no-print space-y-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scoreformulier</h1>
          <p className="text-muted-foreground">
            Genereer een afdrukbaar scoreformulier per baan · Landscape A4
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-1 w-full sm:w-72">
            <label className="text-sm font-medium">Toernooi</label>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer toernooi" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 w-full sm:w-48">
            <label className="text-sm font-medium">Ronde</label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ronde 1</SelectItem>
                <SelectItem value="2">Ronde 2</SelectItem>
                <SelectItem value="3">Ronde 3 (blanco per baan)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canPrint && (
            <Button onClick={() => window.print()} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Afdrukken / PDF
            </Button>
          )}
        </div>

        {loading && <p className="text-muted-foreground text-sm">Wedstrijden laden...</p>}

        {selectedTournament && (
          <p className="text-sm text-muted-foreground">
            {selectedRound === "3"
              ? `${courts.length} banen · 1 pagina per baan`
              : matches.length > 0
              ? `${sortedCourtNames.length} banen · ${sortedCourtNames.length} pagina's`
              : !loading
              ? "Geen wedstrijden gevonden voor deze ronde."
              : ""}
          </p>
        )}
      </div>

      {/* Printgebied */}
      {selectedTournament && (
        <div id="scoreform-print">

          {/* R1 / R2 — per baan */}
          {selectedRound !== "3" &&
            sortedCourtNames.map((courtName) => {
              const courtMatches = matchesByCourt[courtName].sort((a, b) => a.match_number - b.match_number);
              return (
                <div
                  key={courtName}
                  className="sf-page"
                  style={{ background: "white", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.10)", padding: "16px 20px", marginBottom: 16, maxWidth: 1060 }}
                >
                  <PageHeader tournament={selectedTournament} roundLabel={roundLabel} courtName={courtName} />
                  {courtMatches.map((m) => (
                    <MatchBlock
                      key={m.id}
                      matchNumber={m.match_number}
                      team1p1={m.team1_player1}
                      team1p2={m.team1_player2}
                      team2p1={m.team2_player1}
                      team2p2={m.team2_player2}
                      specials={SPECIALS_COLUMN}
                    />
                  ))}
                  <PageFooter tournament={selectedTournament} courtName={courtName} roundLabel={roundLabel} />
                </div>
              );
            })}

          {/* R3 — blanco per baan */}
          {selectedRound === "3" &&
            courts.map((court) => (
              <div
                key={court.id}
                className="sf-page"
                style={{ background: "white", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.10)", padding: "16px 20px", marginBottom: 16, maxWidth: 1060 }}
              >
                <PageHeader tournament={selectedTournament} roundLabel="RONDE 3" courtName={court.name} />
                {[1, 2, 3].map((n) => (
                  <MatchBlock key={n} matchNumber={n} team1p1="" team1p2="" team2p1="" team2p2="" specials={SPECIALS_COLUMN} blank />
                ))}
                <PageFooter tournament={selectedTournament} courtName={court.name} roundLabel="RONDE 3" />
              </div>
            ))}

        </div>
      )}
    </>
  );
}
