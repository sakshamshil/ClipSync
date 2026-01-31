export interface Paste {
  id: string;
  room_code: string;
  content: string;
  type: 'text' | 'image';
  created_at: string;
}

export interface PasteInsert {
  room_code: string;
  content: string;
  type: 'text' | 'image';
}
