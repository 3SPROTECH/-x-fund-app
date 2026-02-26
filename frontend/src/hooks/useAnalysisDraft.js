import { useState, useEffect, useRef, useCallback } from 'react';
import { analysteApi } from '../api/analyste';

const AUTOSAVE_DELAY = 5000;

export default function useAnalysisDraft(projectId) {
  const [draftId, setDraftId] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [initialData, setInitialData] = useState(null);

  const isDirtyRef = useRef(false);
  const formDataRef = useRef({});
  const stepRef = useRef({ macroIndex: 0, microIndex: 0 });
  const timerRef = useRef(null);
  const draftIdRef = useRef(null);

  // Keep draftIdRef in sync so the save callback always has the latest value
  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  // Load existing draft on mount
  useEffect(() => {
    if (!projectId) {
      setLoadingDraft(false);
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const res = await analysteApi.getDraft(projectId);
        const draft = res.data?.data;
        if (!cancelled && draft) {
          setDraftId(draft.id);
          setLastSavedAt(draft.last_saved_at);
          const fd = draft.form_data || {};
          setInitialData({
            formData: fd,
            macroIndex: fd._macroIndex ?? draft.current_step ?? 0,
            microIndex: fd._microIndex ?? 0,
          });
        }
      } catch {
        // No draft exists yet
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    }
    load();

    return () => { cancelled = true; };
  }, [projectId]);

  // Persist form data to the server
  const save = useCallback(async () => {
    if (!projectId || !isDirtyRef.current) return;
    setSaving(true);
    try {
      const payload = {
        form_data: {
          ...formDataRef.current,
          _macroIndex: stepRef.current.macroIndex,
          _microIndex: stepRef.current.microIndex,
        },
        current_step: stepRef.current.macroIndex,
      };

      if (draftIdRef.current) {
        const res = await analysteApi.updateDraft(projectId, payload);
        setLastSavedAt(res.data.data.last_saved_at);
      } else {
        const res = await analysteApi.saveDraft(projectId, payload);
        setDraftId(res.data.data.id);
        setLastSavedAt(res.data.data.last_saved_at);
      }
      isDirtyRef.current = false;
    } catch {
      // Silent fail for auto-save
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  // Mark form as dirty and schedule debounced auto-save
  const markDirty = useCallback((formData, macroIndex, microIndex) => {
    formDataRef.current = formData;
    stepRef.current = { macroIndex, microIndex };
    isDirtyRef.current = true;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DELAY);
  }, [save]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Delete draft (after report generation)
  const deleteDraft = useCallback(async () => {
    if (!projectId || !draftIdRef.current) return;
    try {
      await analysteApi.deleteDraft(projectId);
      setDraftId(null);
    } catch {
      // Silent fail
    }
  }, [projectId]);

  return {
    loadingDraft,
    initialData,
    lastSavedAt,
    saving,
    markDirty,
    saveDraft: save,
    deleteDraft,
  };
}
