// src/app/dto/auth/RegisterDto.ts
import type { DistrictName, LanguageOption, NationalityOption } from "../../constants/Options";

export type RegisterDto = {
  appUserName: string;
  appUserEmail: string;
  appUserPassword: string;

  appUserNationality: NationalityOption | string;
  appUserLanguagesSpoken: LanguageOption[]; // w UI zawsze trzymasz w tym formacie
  appUserCity: string;

  appUserLiveInDistrict: DistrictName | string;
};
