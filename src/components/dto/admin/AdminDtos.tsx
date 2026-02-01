// src/app/dto/admin/AdminDtos.ts

export type UserEntity = {
  id: number;
  appUserName: string;
  appUserEmail: string;
};

export type ArtPieceEntity = {
  id: number;
  artPieceAddress: string;
  artPieceName: string;
  artPieceUserDescription: string;
};
