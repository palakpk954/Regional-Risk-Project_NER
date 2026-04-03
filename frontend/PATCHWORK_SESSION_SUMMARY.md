# Placify AI Patchwork Summary (Simple English)

## First Version (Today Morning)
- App had dashboard-like UI but data flow was mixed.
- Input parsing was not strict enough for real-world CSV and Sheets.
- Metrics and simulator logic were not fully aligned on one canonical engine source.
- Report output and page values could drift if state changed in different places.

## Current Version (Now)
- One clean pipeline is active:
  Upload -> Parse -> Clean -> Engine -> Dashboard -> Simulator -> Report.
- CSV and Google Sheets now normalize into the same student structure.
- Engine metrics are deterministic and shared across all pages.
- Simulator uses branch-scoped baseline and correct delta math.
- Reports use the same engine + simulator snapshot used by UI cards.
- Top-tech company auto detection index is integrated (4000+ signatures).
- Real-time feel improved with live heartbeat and elapsed run timing.

## What Is Automatic Now
- Header normalization and cleaning for CSV.
- Public-sheet gviz JSON parsing and mapping.
- Empty-row removal and status normalization.
- Company intelligence detection against a 1000+ (currently 4000+) tech index.
- KPI, chart, simulator, and report updates from one shared engine snapshot.
- Simulation recalculation on every control change.
- AI copilot insights generated from real current data (offline rules).

## Demo Flow (Recommended)
1. Upload CSV or public Google Sheet.
2. Show instant dashboard KPIs and charts.
3. Open simulator and change threshold/branch.
4. Show immediate delta and scenario insights.
5. Open reports and export summary with same numbers.
