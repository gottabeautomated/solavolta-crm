// Simple global event bus using EventTarget for cross-component navigation/actions

type OpenLeadDetailPayload = { leadId: string; section?: string | null }

class AppEventBus extends EventTarget {
  emitOpenLeadDetail(payload: OpenLeadDetailPayload) {
    this.dispatchEvent(new CustomEvent('open-lead-detail', { detail: payload }))
  }
}

export const eventBus = new AppEventBus()

export function openLeadDetail(leadId: string, section?: string | null) {
  eventBus.emitOpenLeadDetail({ leadId, section: section ?? null })
}


