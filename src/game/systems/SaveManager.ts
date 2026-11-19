import { CustomWaypoint, VehicleUpgradeLevels } from '../ui/GameEvents';
import type { SavedProgressionState } from './ProgressionManager';
import type { SavedSandboxState } from './SandboxExplorationManager';
import type { SavedTerrariaState } from './TerrariaSandboxManager';
import type { SavedWeaponState } from './WeaponManager';

export const CURRENT_MAP_LAYOUT_VERSION = 2;

export interface SavedVehicleState {
  x: number;
  y: number;
  angleDeg: number;
  health: number;
  upgrades: VehicleUpgradeLevels;
  paintColor?: number | null;
}

export interface SaveData {
  version: 1 | 2;
  mapLayoutVersion?: number;
  savedAt: number;
  district: string;
  player: {
    x: number;
    y: number;
    health: number;
    armor?: number;
    cash: number;
  };
  ownsSafehouse?: boolean;
  completedMissionIds: string[];
  totalMissionEarnings: number;
  vehicles: Record<string, SavedVehicleState>;
  weapons?: SavedWeaponState;
  collectedChipIds?: string[];
  progression?: SavedProgressionState;
  sandbox?: SavedSandboxState;
  terraria?: SavedTerrariaState;
  customWaypoint?: CustomWaypoint | null;
  settings: {
    muted: boolean;
  };
}

export interface SaveSummary {
  hasSave: boolean;
  savedAt: number | null;
  cash: number | null;
  completedCount: number;
}

const SAVE_KEY = 'neon_district_save_v1';

export class SaveManager {
  public loadSave(): SaveData | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (
        (parsed.version !== 1 && parsed.version !== 2) ||
        typeof parsed.savedAt !== 'number' ||
        !parsed.player ||
        typeof parsed.player.x !== 'number' ||
        typeof parsed.player.y !== 'number' ||
        typeof parsed.player.health !== 'number' ||
        typeof parsed.player.cash !== 'number'
      ) {
        return null;
      }

      return {
        version: 2,
        mapLayoutVersion:
          typeof parsed.mapLayoutVersion === 'number' ? parsed.mapLayoutVersion : 1,
        savedAt: parsed.savedAt,
        district: typeof parsed.district === 'string' ? parsed.district : '霓虹广场',
        player: {
          x: parsed.player.x,
          y: parsed.player.y,
          health: parsed.player.health,
          armor: typeof parsed.player.armor === 'number' ? parsed.player.armor : 0,
          cash: parsed.player.cash,
        },
        ownsSafehouse: Boolean(parsed.ownsSafehouse),
        completedMissionIds: Array.isArray(parsed.completedMissionIds)
          ? parsed.completedMissionIds.filter((id): id is string => typeof id === 'string')
          : [],
        totalMissionEarnings:
          typeof parsed.totalMissionEarnings === 'number' ? parsed.totalMissionEarnings : 0,
        vehicles: parsed.vehicles && typeof parsed.vehicles === 'object' ? parsed.vehicles : {},
        weapons: parsed.weapons,
        collectedChipIds: Array.isArray(parsed.collectedChipIds)
          ? parsed.collectedChipIds.filter((id): id is string => typeof id === 'string')
          : [],
        progression: parsed.progression,
        sandbox: parsed.sandbox,
        terraria: parsed.terraria,
        customWaypoint: parsed.customWaypoint ?? null,
        settings: {
          muted: Boolean(parsed.settings?.muted),
        },
      };
    } catch {
      return null;
    }
  }

  public writeSave(data: SaveData): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  public clearSave(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {
      // Ignore storage access errors
    }
  }

  public getSummary(): SaveSummary {
    const save = this.loadSave();
    if (!save) {
      return {
        hasSave: false,
        savedAt: null,
        cash: null,
        completedCount: 0,
      };
    }
    return {
      hasSave: true,
      savedAt: save.savedAt,
      cash: save.player.cash,
      completedCount: save.completedMissionIds.length,
    };
  }
}
