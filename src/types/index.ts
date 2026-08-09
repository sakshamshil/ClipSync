export interface Paste {
  id: string;
  room_code: string;
  content: string;
  type: 'text' | 'image' | 'document';
  file_name?: string | null;
  file_size?: number | null;
  created_at: string;
}

export interface PasteInsert {
  room_code: string;
  content: string;
  type: 'text' | 'image' | 'document';
  file_name?: string;
  file_size?: number;
}
