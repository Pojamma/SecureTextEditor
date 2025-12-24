import { create } from 'zustand';
import { OpenDocument } from '@/types/document.types';

interface DocumentState {
  documents: OpenDocument[];
  activeDocumentId: string | null;

  // Actions
  addDocument: (document: OpenDocument) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<OpenDocument>) => void;
  setActiveDocument: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markAsModified: (id: string, modified: boolean) => void;
  closeDocument: (id: string) => void;
  closeAllDocuments: () => void;
  restoreSession: (documents: OpenDocument[], activeDocumentId: string | null) => void;

  // Getters
  getActiveDocument: () => OpenDocument | null;
  getDocument: (id: string) => OpenDocument | null;
  hasUnsavedChanges: () => boolean;
  getModifiedDocuments: () => OpenDocument[];
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  activeDocumentId: null,

  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document],
    activeDocumentId: document.id,
  })),

  removeDocument: (id) => set((state) => {
    const newDocs = state.documents.filter(doc => doc.id !== id);
    const newActiveId = state.activeDocumentId === id
      ? (newDocs.length > 0 ? newDocs[newDocs.length - 1].id : null)
      : state.activeDocumentId;

    return {
      documents: newDocs,
      activeDocumentId: newActiveId,
    };
  }),

  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map(doc =>
      doc.id === id ? { ...doc, ...updates } : doc
    ),
  })),

  setActiveDocument: (id) => set({ activeDocumentId: id }),

  updateContent: (id, content) => set((state) => ({
    documents: state.documents.map(doc =>
      doc.id === id ? { ...doc, content, modified: true } : doc
    ),
  })),

  markAsModified: (id, modified) => set((state) => ({
    documents: state.documents.map(doc =>
      doc.id === id ? { ...doc, modified } : doc
    ),
  })),

  closeDocument: (id) => {
    get().removeDocument(id);
  },

  closeAllDocuments: () => set({
    documents: [],
    activeDocumentId: null,
  }),

  restoreSession: (documents, activeDocumentId) => set({
    documents,
    activeDocumentId,
  }),

  // Getters
  getActiveDocument: () => {
    const { documents, activeDocumentId } = get();
    return documents.find(doc => doc.id === activeDocumentId) || null;
  },

  getDocument: (id) => {
    const { documents } = get();
    return documents.find(doc => doc.id === id) || null;
  },

  hasUnsavedChanges: () => {
    const { documents } = get();
    return documents.some(doc => doc.modified);
  },

  getModifiedDocuments: () => {
    const { documents } = get();
    return documents.filter(doc => doc.modified);
  },
}));
