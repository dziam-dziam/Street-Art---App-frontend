export type UserEntity = {
  id: number;
  appUserName: string;
  appUserEmail: string;
};

export type ArtPieceEntity = {
  id: number;

  artPieceAddress?: string | null;
  artPieceName?: string | null;
  artPieceUserDescription?: string | null;

  // ✅ te pola potrzebujesz do edycji:
  artPiecePosition?: string | null;
  artPieceContainsText?: boolean | null;

  artPieceTypes?: string[] | null;
  artPieceStyles?: string[] | null;
  artPieceTextLanguages?: string[] | null;
};
