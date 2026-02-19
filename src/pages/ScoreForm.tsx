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
  end_date: string;
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
  court_row_side: string;
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
}

const SPECIALS_COLUMN = [{ id: "specials", name: "Specials" }];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowSideLabel(side: string): { label: string; color: string } {
  if (side === "left")  return { label: "Rijtje Links",  color: "#15803d" };
  if (side === "right") return { label: "Rijtje Rechts", color: "#1d4ed8" };
  return { label: "", color: "#6b7280" };
}

function sortCourtNames(courtNames: string[], matchesByCourt: Record<string, MatchRow[]>): string[] {
  const by = (side: string) => courtNames
    .filter(n => matchesByCourt[n][0]?.court_row_side === side)
    .sort((a, b) => (matchesByCourt[a][0]?.court_menu_order ?? 999) - (matchesByCourt[b][0]?.court_menu_order ?? 999));
  const other = courtNames
    .filter(n => !["left", "right"].includes(matchesByCourt[n][0]?.court_row_side ?? ""))
    .sort((a, b) => (matchesByCourt[a][0]?.court_menu_order ?? 999) - (matchesByCourt[b][0]?.court_menu_order ?? 999));
  return [...by("left"), ...by("right"), ...other];
}

function sortCourts(courts: Court[]): Court[] {
  const by = (side: string) => courts
    .filter(c => c.row_side === side)
    .sort((a, b) => (a.menu_order ?? 999) - (b.menu_order ?? 999));
  const other = courts
    .filter(c => !["left", "right"].includes(c.row_side ?? ""))
    .sort((a, b) => (a.menu_order ?? 999) - (b.menu_order ?? 999));
  return [...by("left"), ...by("right"), ...other];
}

// ─── HTML generator voor printvenster ────────────────────────────────────────

function buildPrintHtml(
  tournament: Tournament,
  pages: {
    courtName: string;
    rowSide: string;
    roundLabel: string;
    matches: { courtIndex: number; dbNum: number; p1: string; p2: string; p3: string; p4: string }[];
  }[],
  logoSrc: string,
): string {

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    @page { size: A4 landscape; margin: 10mm 12mm; }
    body { background: white; }

    .page {
      width: 100%;
      page-break-before: always;
      break-before: page;
      padding: 0;
    }
    .page:first-child {
      page-break-before: avoid;
      break-before: avoid;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #f28b00;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .header-logo { height: 40px; width: auto; }
    .header-title { font-size: 14px; font-weight: 800; color: #111; line-height: 1.2; }
    .header-right { text-align: right; }
    .header-court { font-size: 20px; font-weight: 900; color: #f28b00; line-height: 1; }
    .header-meta { display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 4px; }
    .header-round { font-size: 12px; font-weight: 700; color: #111; }
    .header-badge { font-size: 10px; font-weight: 700; color: #fff; border-radius: 4px; padding: 2px 8px; letter-spacing: .03em; }

    /* Match block */
    .match { border: 1px solid #d1d5db; border-radius: 5px; overflow: hidden; margin-bottom: 10px; page-break-inside: avoid; break-inside: avoid; }
    .match-header { background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 5px 10px; display: flex; align-items: center; gap: 10px; }
    .match-header.blank { background: #f3f4f6; }
    .match-label { color: white; font-size: 10px; font-weight: 800; border-radius: 4px; padding: 2px 9px; letter-spacing: .04em; }
    .match-label.live { background: #f28b00; }
    .match-label.blank { background: #9ca3af; }
    .match-dbnum { font-size: 9px; color: #9ca3af; }

    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; font-size: 9px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: .05em; padding: 4px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; }
    th.left { text-align: left; }
    td { padding: 7px 10px; font-size: 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    td.no-border { border-bottom: none; }
    td.team { width: 54px; text-align: center; font-size: 9px; font-weight: 800; letter-spacing: .04em; border-right: 1px solid #e5e7eb; }
    td.team1 { background: #eff6ff; color: #1d4ed8; }
    td.team2 { background: #f0fdf4; color: #15803d; }
    td.score { width: 70px; text-align: center; background: #fffbeb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }
    td.special { width: 70px; text-align: center; background: #fafafa; vertical-align: bottom; padding-bottom: 6px; }
    td.divider { height: 3px; background: #f9fafb; border-top: 1px dashed #e5e7eb; border-bottom: 1px dashed #e5e7eb; padding: 0; }
    .score-box { display: inline-block; width: 44px; height: 26px; border: 1.5px solid #374151; border-radius: 3px; }
    .special-line { display: inline-block; width: 36px; height: 20px; border-bottom: 1.5px solid #9ca3af; }
    .blank-name { color: #e5e7eb; }

    /* Footer */
    .footer { margin-top: 10px; padding-top: 6px; border-top: 1px solid #f0f0f0; font-size: 8px; color: #c0c0c0; text-align: center; }
  `;

  function renderMatch(
    m: { courtIndex: number; dbNum: number; p1: string; p2: string; p3: string; p4: string } | null,
    idx: number,
    blank = false,
  ): string {
    const label  = blank ? `WEDSTRIJD ${idx + 1}` : `WEDSTRIJD ${m!.courtIndex}`;
    const dbNum  = blank ? "" : `<span class="match-dbnum">#${m!.dbNum}</span>`;
    const p1 = blank ? `<span class="blank-name">________________________</span>` : m!.p1;
    const p2 = blank ? `<span class="blank-name">________________________</span>` : m!.p2;
    const p3 = blank ? `<span class="blank-name">________________________</span>` : m!.p3;
    const p4 = blank ? `<span class="blank-name">________________________</span>` : m!.p4;
    return `
      <div class="match">
        <div class="match-header ${blank ? "blank" : ""}">
          <span class="match-label ${blank ? "blank" : "live"}">${label}</span>
          ${dbNum}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:54px">Team</th>
              <th class="left">Speler</th>
              <th style="width:70px">Score</th>
              <th style="width:70px">Specials</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="team team1" rowspan="2">TEAM 1</td>
              <td>${p1}</td>
              <td class="score" rowspan="2"><div class="score-box"></div></td>
              <td class="special"><div class="special-line"></div></td>
            </tr>
            <tr>
              <td>${p2}</td>
              <td class="special"><div class="special-line"></div></td>
            </tr>
            <tr><td colspan="4" class="divider"></td></tr>
            <tr>
              <td class="team team2" rowspan="2">TEAM 2</td>
              <td>${p3}</td>
              <td class="score" rowspan="2"><div class="score-box"></div></td>
              <td class="special"><div class="special-line"></div></td>
            </tr>
            <tr>
              <td class="no-border">${p4}</td>
              <td class="special no-border"><div class="special-line"></div></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  const pagesHtml = pages.map((page) => {
    const { label, color } = rowSideLabel(page.rowSide);
    const badgeHtml = label
      ? `<span class="header-badge" style="background:${color}">${label}</span>`
      : "";

    const matchesHtml = page.matches.length === 0
      ? [0, 1, 2].map((i) => renderMatch(null, i, true)).join("")
      : page.matches.map((m, i) => renderMatch(m, i, false)).join("");

    return `
      <div class="page">
        <div class="header">
          <div class="header-left">
            <img class="header-logo" src="${logoSrc}" onerror="this.style.display='none'" />
            <div>
              <div class="header-title">${tournament.name}</div>
            </div>
          </div>
          <div class="header-right">
            <div class="header-court">${page.courtName}</div>
            <div class="header-meta">
              <span class="header-round">${page.roundLabel}</span>
              ${badgeHtml}
            </div>
          </div>
        </div>
        ${matchesHtml}
        <div class="footer">
          ${tournament.name} · ${page.courtName} · ${page.roundLabel} · Scores verwerken via de app — dit formulier is alleen voor papieren invoer op locatie
        </div>
      </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <title>Scoreformulier – ${tournament.name}</title>
  <style>${css}</style>
</head>
<body>
  ${pagesHtml}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScoreForm() {
  const { hasRole } = useAuth();

  const [tournaments, setTournaments]                   = useState<Tournament[]>([]);
  const [courts, setCourts]                             = useState<Court[]>([]);
  const [matches, setMatches]                           = useState<MatchRow[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [selectedRound, setSelectedRound]               = useState<string>("1");
  const [loading, setLoading]                           = useState(false);

  useEffect(() => { loadTournaments(); loadCourts(); }, []);

  useEffect(() => {
    if (selectedTournamentId && selectedRound !== "3") loadMatches();
    else setMatches([]);
  }, [selectedTournamentId, selectedRound]);

  async function loadTournaments() {
    const { data } = await supabase
      .from("tournaments")
      .select("id, name, start_date, end_date")
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
        id, match_number, round_number, court_id,
        court:courts(name, menu_order, row_side),
        team1_player1:players!matches_team1_player1_id_fkey(name),
        team1_player2:players!matches_team1_player2_id_fkey(name),
        team2_player1:players!matches_team2_player1_id_fkey(name),
        team2_player2:players!matches_team2_player2_id_fkey(name)
      `)
      .eq("tournament_id", selectedTournamentId)
      .eq("round_number", parseInt(selectedRound))
      .order("match_number", { ascending: true });

    if (!error && data) {
      setMatches((data as any[]).map((m) => ({
        id: m.id,
        match_number: m.match_number,
        round_number: m.round_number,
        court_id: m.court_id,
        court_name: m.court?.name ?? `Baan ${m.court_number ?? "?"}`,
        court_menu_order: m.court?.menu_order ?? 999,
        court_row_side: m.court?.row_side ?? "",
        team1_player1: m.team1_player1?.name ?? "–",
        team1_player2: m.team1_player2?.name ?? "–",
        team2_player1: m.team2_player1?.name ?? "–",
        team2_player2: m.team2_player2?.name ?? "–",
      })));
    }
    setLoading(false);
  }

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);

  const matchesByCourt: Record<string, MatchRow[]> = {};
  for (const m of matches) {
    if (!matchesByCourt[m.court_name]) matchesByCourt[m.court_name] = [];
    matchesByCourt[m.court_name].push(m);
  }
  const sortedCourtNames = sortCourtNames(Object.keys(matchesByCourt), matchesByCourt);
  const sortedCourts     = sortCourts(courts);
  const roundLabel       = `RONDE ${selectedRound}`;
  const canPrint         = selectedTournament && (selectedRound === "3" ? courts.length > 0 : matches.length > 0);

  function handlePrint() {
    if (!selectedTournament) return;

    const logoSrc = `${window.location.origin}/PPP_logo.webp`;
    let pages: Parameters<typeof buildPrintHtml>[1];

    if (selectedRound === "3") {
      pages = sortedCourts.map((court) => ({
        courtName: court.name,
        rowSide:   court.row_side,
        roundLabel: "RONDE 3",
        matches:   [],
      }));
    } else {
      pages = sortedCourtNames.map((courtName) => {
        const courtMatches = [...matchesByCourt[courtName]].sort((a, b) => a.match_number - b.match_number);
        return {
          courtName,
          rowSide:    courtMatches[0]?.court_row_side ?? "",
          roundLabel,
          matches: courtMatches.map((m, idx) => ({
            courtIndex: idx + 1,
            dbNum:      m.match_number,
            p1:         m.team1_player1,
            p2:         m.team1_player2,
            p3:         m.team2_player1,
            p4:         m.team2_player2,
          })),
        };
      });
    }

    const html = buildPrintHtml(selectedTournament, pages, logoSrc);
    const win  = window.open("", "_blank");
    if (!win) {
      alert("Popup geblokkeerd. Sta popups toe voor deze site om het formulier af te drukken.");
      return;
    }
    win.document.write(html);
    win.document.close();
  }

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

  return (
    <div>
      <div className="space-y-4 mb-6">
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
              <SelectTrigger><SelectValue placeholder="Selecteer toernooi" /></SelectTrigger>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ronde 1</SelectItem>
                <SelectItem value="2">Ronde 2</SelectItem>
                <SelectItem value="3">Ronde 3 (blanco per baan)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canPrint && (
            <Button onClick={handlePrint} className="flex items-center gap-2">
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
    </div>
  );
}
