import {TRANSPORT_OPTIONS } from "../../constants/Options";
type MeansOfTransport = (typeof TRANSPORT_OPTIONS)[number]["value"];

export type AddCommuteDto = {
  commuteThroughDistrictName: string;
  commuteTripsPerWeek: number;
  commuteStartHour: number;
  commuteStopHour: number;
  commuteMeansOfTransport: MeansOfTransport[];
};