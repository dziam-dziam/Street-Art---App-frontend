// src/app/dto/artpiece/AddArtPieceDto.ts
import type { ArtTypeOption, ArtStyleOption, LanguageOption } from "../../constants/options";

export type AddArtPieceDto = {
  artPieceAddress: string;
  artPieceName: string;
  artPieceContainsText: boolean;
  artPiecePosition: string;
  artPieceUserDescription: string;
  artPieceDistrict: string;
  artPieceCity: string;

  artPieceTypes: ArtTypeOption[];
  artPieceStyles: ArtStyleOption[];
  artPieceTextLanguages: LanguageOption[];
};
