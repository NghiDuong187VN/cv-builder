import { CV, CVTheme, CVSection } from '@/lib/types';
import { create } from 'zustand';

interface CVEditorState {
  cv: Partial<CV> | null;
  isDirty: boolean;
  activeSection: CVSection | null;

  setCV: (cv: Partial<CV>) => void;
  updateContent: (section: CVSection, value: unknown) => void;
  updateTheme: (theme: Partial<CVTheme>) => void;
  updateSectionOrder: (order: CVSection[]) => void;
  toggleSectionVisibility: (section: CVSection) => void;
  setActiveSection: (section: CVSection | null) => void;
  markClean: () => void;
}

export const useCVStore = create<CVEditorState>((set) => ({
  cv: null,
  isDirty: false,
  activeSection: null,

  setCV: (cv) => set({ cv, isDirty: false }),

  updateContent: (section, value) =>
    set((state) => ({
      cv: {
        ...state.cv,
        content: {
          ...state.cv?.content,
          [section]: value,
        } as CV['content'],
      },
      isDirty: true,
    })),

  updateTheme: (theme) =>
    set((state) => ({
      cv: {
        ...state.cv,
        theme: { ...state.cv?.theme, ...theme } as CVTheme,
      },
      isDirty: true,
    })),

  updateSectionOrder: (order) =>
    set((state) => ({
      cv: {
        ...state.cv,
        sections: {
          order,
          visibility: state.cv?.sections?.visibility ?? {},
        },
      },
      isDirty: true,
    })),

  toggleSectionVisibility: (section) =>
    set((state) => {
      const current = state.cv?.sections?.visibility?.[section] ?? true;
      return {
        cv: {
          ...state.cv,
          sections: {
            order: state.cv?.sections?.order ?? [],
            visibility: {
              ...state.cv?.sections?.visibility,
              [section]: !current,
            },
          },
        },
        isDirty: true,
      };
    }),

  setActiveSection: (section) => set({ activeSection: section }),
  markClean: () => set({ isDirty: false }),
}));
