import type { UserDto } from "@roms/shared";
import { apiGet } from "../../../lib/api-client.js";

export function listInterviewers() {
  return apiGet<UserDto[]>("/users/interviewers");
}
