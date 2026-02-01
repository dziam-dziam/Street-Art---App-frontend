// src/app/dto/commute/AddCommuteDto.ts
import type { MeansOfTransport } from "../../constants/Options";

export type AddCommuteDto = {
  commuteThroughDistrictName: string;
  commuteTripsPerWeek: number;
  commuteStartHour: number;
  commuteStopHour: number;
  commuteMeansOfTransport: MeansOfTransport[];
};
