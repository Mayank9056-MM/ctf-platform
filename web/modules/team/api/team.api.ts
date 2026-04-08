import { api } from "@/shared/lib/api";
import {
  CreateTeamPayload,
  PaginationMeta,
  SearchTeamParams,
  Team,
  TeamSearchResponse,
  TeamSearchResult,
  UpdateTeamPayload,
} from "../types/team.types";
import { ApiResponse } from "@/shared/types/api.types";

function buildParams(obj: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p;
}

// PUBLIC ROUTES (no auth required)

// GET /teams/get-team/:id

/**
 * Retrieves a team by its ID.
 *
 * @param id The ID of the team to fetch
 * @returns The team document
 * @throws {ApiError} If the team is not found
 */
export async function getTeamByIdApi(id: string): Promise<Team> {
  const res = await api.get<ApiResponse<{ team: Team }>>(
    `/api/v1/team/teams/get-team/${id}`,
  );
  return res.data.data.team;
}

// GET /teams/search

/**
 * Search for teams based on the given filters.
 *
 * @param {SearchTeamParams} [params] - filters to apply to the search
 * @property {string} [params.q] - name of the team to search for
 * @property {string} [params.country] - country of the team to search for
 * @property {string} [params.sortBy] - field to sort the results by
 * @property {string} [params.sortOrder] - order to sort the results in
 * @property {number} [params.page] - page number to return
 * @property {number} [params.limit] - number of teams to return per page
 *
 * @return an object containing the search results and metadata
 * @property {ITeamSearchResult[]} teams - the teams that match the filters
 * @property {PaginationMeta} meta - metadata about the search results
 */
export async function searchTeamsApi(
  params: SearchTeamParams = {},
): Promise<{ teams: TeamSearchResult[]; meta: PaginationMeta }> {
  const qs = buildParams(params as Record<string, unknown>);
  const res = await api.get<ApiResponse<TeamSearchResponse>>(
    `/api/v1/team/search?${qs}`,
  );

  return {
    teams: res.data.data.teams,
    meta: res.data.data.meta,
  };
}

// PRIVATE ROUTES (auth required)

// GET /teams/my

/**
 * Retrieves the team of the currently logged in user.
 *
 * @returns The team document if the user is in a team, null otherwise
 * @throws {ApiError} If the request fails
 */
export async function getMyTeamApi(): Promise<Team | null> {
  const res = await api.get<ApiResponse<Team | null>>("/api/v1/team/my");
  return res.data.data;
}

// POST /teams/

/**
 * Creates a new team with the given payload.
 *
 * @param {CreateTeamPayload} payload - data to create the team with
 * @property {string} name - name of the team
 * @property {string} country - country of the team
 * @property {number} maxMembers - maximum number of members for the team
 *
 * @returns The newly created team document
 * @throws {ApiError} If the request fails
 */
export async function createTeamApi(payload: CreateTeamPayload): Promise<Team> {
  const res = await api.post<ApiResponse<{ team: Team }>>(
    "/api/v1/team/",
    payload,
  );
  return res.data.data.team;
}

// PATCH /teams/:id

/**
 * Updates a team with the given payload.
 *
 * @param teamId The ID of the team to update
 * @param payload The data to update the team with
 * @property {string} [name] The new name for the team
 * @property {string} [country] The new country for the team
 * @property {number} [maxMembers] The new maximum member count for the team
 *
 * @returns The updated team document
 * @throws {ApiError} If the request fails
 */
export async function updateTeamApi(
  teamId: string,
  payload: UpdateTeamPayload,
): Promise<Team> {
  const res = await api.patch<ApiResponse<{ team: Team }>>(
    `/api/v1/team/${teamId}`,
    payload,
  );
  return res.data.data.team;
}

// POST /teams/join

/**
 * Joins a team by the given join code.
 *
 * @param code The join code to use
 *
 * @returns The newly joined team document
 * @throws {ApiError} If the request fails
 */
export async function joinTeamByCodeApi(code: string): Promise<Team> {
  const res = await api.post<ApiResponse<{ team: Team }>>("/api/v1/team/join", {
    code: code.toUpperCase().trim(),
  });
  return res.data.data.team;
}

// POST /teams/leave

/**
 * Leaves the currently logged in user's team.
 *
 * @returns A promise that resolves when the request is successful
 * @throws {ApiError} If the request fails
 */
export async function leaveTeamApi(): Promise<void> {
  await api.post("/api/v1/team/leave");
}

// POST /teams/:id/join-code

/**
 * Generates a new join code for the given team. Owner only.
 *
 * @param teamId The ID of the team to generate a join code for
 * @returns A promise that resolves with the newly generated join code
 * @throws {ApiError} If the request fails
 */
export async function generateJoinCodeApi(teamId: string): Promise<string> {
  const res = await api.post<ApiResponse<{ joinCode: string }>>(
    `/api/v1/team/${teamId}/join-code`,
  );
  return res.data.data.joinCode;
}

// POST /teams/:id/invite

/**
 * Invite a user to a team.
 *
 * @param teamId The ID of the team to invite the user to
 * @param username The username of the user to invite
 *
 * @throws {ApiError} If the request fails
 */
export async function inviteUserApi(
  teamId: string,
  username: string,
): Promise<void> {
  await api.post(`/api/v1/team/${teamId}/invite`, { username });
}

// POST /teams/:id/accept-invite

/**
 * Accept a pending team invite as the given user. Removes the invite from the team.
 * @param teamId The ID of the team to accept the invite from
 * @returns A promise that resolves with the team document after accepting the invite
 * @throws {ApiError} If the request fails
 */
export async function acceptInviteApi(teamId: string): Promise<Team> {
  const res = await api.post<ApiResponse<{ team: Team }>>(
    `/api/v1/team/${teamId}/accept-invite`,
  );
  return res.data.data.team;
}

// POST /teams/:id/decline-invite

/**
 * Decline a pending team invite as the given user. Removes the invite from the team.
 * @param teamId The ID of the team to decline the invite from
 * @throws {ApiError} If the request fails
 */
export async function declineInviteApi(teamId: string): Promise<void> {
  await api.post(`/api/v1/team/${teamId}/decline-invite`);
}

// DELETE /teams/:id/members/:userId

/**
 * Kick a user from a team by its ID and the user ID to kick.
 * @param teamId The ID of the team to kick the user from
 * @param userId The ID of the user to kick from the team
 * @throws {ApiError} If the request fails
 */
export async function kickMemberApi(
  teamId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/api/v1/team/${teamId}/members/${userId}`);
}

// DELETE /teams/:id/disband (admin)

/**
 * Disbands a team by its ID as an administrator.
 * This is a protected operation that requires the requester to have the "admin" or "superadmin" role.
 * @param teamId The ID of the team to disband
 * @throws {ApiError} If the request fails
 */
export async function adminDisbandTeamApi(teamId: string): Promise<void> {
  await api.delete(`/api/v1/team/${teamId}/disband`);
}
