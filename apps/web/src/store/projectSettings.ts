import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type SidebarType = "projectMembers" | "npmPackages";

type State = {
  sidebar: {
    active: SidebarType;
  };
};

type Actions = {
  actions: {
    setSidebarActive: (active: SidebarType) => void;
  };
};

const projectSettingsStore = create<State & Actions>()(
  immer((set) => ({
    sidebar: {
      active: "projectMembers",
    },
    actions: {
      setSidebarActive: (active: SidebarType) => {
        set((state) => {
          state.sidebar.active = active;
        });
      },
    },
  }))
);

export function useProjectSettingsSidebarStore() {
  return projectSettingsStore((state) => state.sidebar);
}

export function useProjectSettingsActions() {
  return projectSettingsStore((state) => state.actions);
}
