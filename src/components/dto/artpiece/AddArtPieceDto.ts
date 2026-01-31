import { DISTRICT_OPTIONS, ART_TYPE_OPTIONS, ART_STYLE_OPTIONS } from "../../constants/Options";
type ArtPieceTypes = (typeof ART_TYPE_OPTIONS)[number]["value"];
type ArtPieceStyles = (typeof ART_STYLE_OPTIONS)[number]["value"];

export type AddArtPieceDto = {
  artPieceAddress: string;
  artPieceName: string;
  artPieceContainsText: boolean;
  artPiecePosition: string;
  artPieceUserDescription: string;
  artPieceDistrict: string;
  artPieceCity: string;
  artPieceTypes: ArtPieceTypes[];
  artPieceStyles: ArtPieceStyles[];
  artPieceTextLanguages: string[];
};