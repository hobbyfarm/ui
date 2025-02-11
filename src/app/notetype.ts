const noteTypes = ['info', 'warn', 'caution', 'task', 'other'] as const;

export type NoteType = (typeof noteTypes)[number];

export function isNoteType(value: string): value is NoteType {
  return (noteTypes as readonly string[]).includes(value);
}
