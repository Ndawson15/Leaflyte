export type AiEditStatus = 'pending' | 'previewing' | 'applied' | 'declined';

export interface AiEditPreviewSession {
  editKey: string;
  path: string;
  originalContent: string;
}
