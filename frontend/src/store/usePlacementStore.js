import { create } from 'zustand';
import {
  defaultSimulationControls,
  runPlacementEngine,
  runPlacementSimulation,
} from '../services/engineService';

const STORAGE_KEY = 'placement_engine_rows_v1';

function loadPersistedRows() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistRows(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows || []));
}

function buildInitialState() {
  const inputRows = loadPersistedRows();
  const engine = runPlacementEngine(inputRows);
  const simulationControls = { ...defaultSimulationControls };
  const simulation = runPlacementSimulation(engine, simulationControls);
  const branchStats = engine.branchStats || engine.branchPerformance || [];

  return {
    inputRows,
    engine,
    simulationControls,
    simulation,
    availableBranches: ['All', ...branchStats.map((row) => row.branch)],
    migrationPreviewRows: inputRows,
    migrationImportMeta: {
      rawRows: inputRows.length,
      cleanedRows: inputRows.length,
    },
    migrationSource: inputRows.length ? 'Saved local session' : null,
    migrationErrors: [],
    loading: false,
    hasData: engine.kpis.totalStudents > 0,
    lastProcessedAt: engine.processedAt,
  };
}

export const usePlacementStore = create((set) => ({
  ...buildInitialState(),

  runMigrationImportFromRows: async (rows, source, importMeta = {}) => {
    set({ loading: true, migrationErrors: [] });

    const engine = runPlacementEngine(rows || []);
    const normalizedRows = engine.records;
    const errors = normalizedRows.length ? [] : ['No valid rows found after cleaning. Check CSV headers or sheet fields.'];
    const simulationControls = { ...defaultSimulationControls };
    const simulation = runPlacementSimulation(engine, simulationControls);
    const branchStats = engine.branchStats || engine.branchPerformance || [];

    persistRows(normalizedRows);

    set({
      loading: false,
      inputRows: normalizedRows,
      engine,
      simulationControls,
      simulation,
      availableBranches: ['All', ...branchStats.map((row) => row.branch)],
      migrationPreviewRows: normalizedRows,
      migrationImportMeta: {
        rawRows: Number(importMeta.rawRows || rows.length || normalizedRows.length),
        cleanedRows: normalizedRows.length,
      },
      migrationSource: source || 'Manual import',
      migrationErrors: errors,
      hasData: engine.kpis.totalStudents > 0,
      lastProcessedAt: engine.processedAt,
    });

    return {
      students: engine.kpis.totalStudents,
      placed: engine.kpis.placedStudents,
      companies: new Set(
        engine.records
          .map((row) => row.company)
          .filter((company) => company && company !== 'Unassigned'),
      ).size,
      applications: normalizedRows.filter((row) => row.company && row.company !== 'Unassigned').length,
      errors,
    };
  },

  clearEngineData: () => {
    localStorage.removeItem(STORAGE_KEY);
    const reset = buildInitialState();
    set({ ...reset, migrationSource: null });
  },

  updateSimulationControl: (key, value) => {
    set((state) => {
      if (state.simulationControls[key] === value) {
        return state;
      }

      const controls = { ...state.simulationControls, [key]: value };
      return {
        simulationControls: controls,
        simulation: runPlacementSimulation(state.engine, controls),
      };
    });
  },

  applySimulationPreset: (nextValues) => {
    set((state) => {
      const controls = { ...state.simulationControls, ...(nextValues || {}) };
      if (JSON.stringify(controls) === JSON.stringify(state.simulationControls)) {
        return state;
      }

      return {
        simulationControls: controls,
        simulation: runPlacementSimulation(state.engine, controls),
      };
    });
  },

  clearMigrationPreview: () => set({ migrationPreviewRows: [], migrationSource: null, migrationErrors: [] }),
}));
