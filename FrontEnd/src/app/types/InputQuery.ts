export interface FormState {
  site: string;
  eventType: string;
  sourceSystem: string;
  description: string;
  batch: string;
  system: string;
  dateTimeDetected: string;
  immediateActions: string;
}

export type FormErrors = Partial<Record<keyof FormState, string>>;