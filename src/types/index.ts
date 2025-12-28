export interface Paste {
  id: string;
  room_code: string;
  content: string;
  created_at: string;
}

export interface PasteInsert {
  room_code: string;
  content: string;
}
