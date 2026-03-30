import mongoose, { Types } from "mongoose";
import Team, { ITeam } from "../../models/team.model";
import { ApiError } from "../../utils/ApiError";
import User from "../../models/user.model";
import { createTeamInput, SearchTeamInput, updateTeamInput } from "./team.type";
import { ADDRGETNETWORKPARAMS } from "dns";

class TeamService {
  // helpers

  /**
   * Finds a team by its ID and throws if not found or inactive.
   * @param teamId - The ID of the team to find.
   * @returns A promise that resolves to the found team.
   * @throws {ApiError} 404 - Team not found
   */
  private async findActiveTeam(teamId: string): Promise<ITeam> {
    const team = await Team.findById(teamId);

    if (!team || !team.isActive) {
      throw new ApiError(404, "Team not found");
    }

    return team;
  }

  /**
   * Asserts that the given user is the owner of the given team.
   * Throws a 403 error if not the owner.
   * @param team - The team to check ownership of.
   * @param userId - The user to check ownership of.
   */
  private assertOwner(team: ITeam, userId: Types.ObjectId): void {
    if (team.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "Only the team owner can perform this action");
    }
  }

  // main

  /**
   * Creates a new team.
   * @param data - The data to create the team with.
   * @returns A promise that resolves to the created team.
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 400 - You are already in a team. Leave you current team first.
   * @throws {ApiError} 400 - Team name already exists
   */
  async createTeam(data: createTeamInput): Promise<ITeam> {
    const { name, description, isPrivate, country, ownerId } = data;

    const user = await User.findById(ownerId).select("teamId");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.teamId) {
      throw new ApiError(
        400,
        "You are already in a team. Leave you current team first."
      );
    }

    // case-insensitive name uniqueness check
    const existingName = await Team.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingName) {
      throw new ApiError(400, "Team name already exists");
    }

    const team = await Team.create({
      name,
      description,
      isPrivate: isPrivate || false,
      country,
      owner: ownerId,
      members: [ownerId],
    });

    await User.findByIdAndUpdate(ownerId, { teamId: team._id });

    return team;
  }

  /**
   * Fetches a team by ID and throws if not found or inactive.
   * Includes team members and owner, but excludes invites unless specified.
   * @param teamId - The ID of the team to fetch.
   * @param includeInvites - Whether to include invites in the response.
   * @returns A promise resolving to the fetched team.
   * @throws {ApiError} 404 - Team not found
   */
  async getTeamById(teamId: string, includeInvites = false) {
    const team = await Team.findById(teamId)
      .select(includeInvites ? "" : "-invites")
      .populate("members", "username avatar score country solvedChallenges")
      .populate("owner", "username avatar")
      .lean();

    if (!team || !team.isActive) {
      throw new ApiError(404, "Team not found");
    }
    return team;
  }

  /**
   * Get the team the given user belongs to.
   * If the user is not in a team, returns null.
   * @param userId - The ID of the user to fetch the team for.
   * @returns A promise resolving to the team the user belongs to, or null if not in a team.
   */
  async getMyTeam(userId: Types.ObjectId) {
    const user = await User.findById(userId).select("teamId");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.teamId) return null;

    return this.getTeamById(user.teamId.toString(), true);
  }

  /**
   * Updates a team with given data.
   * Only the team owner can update team settings.
   * @param {updateTeamInput} data - The data to update team with.
   * @throws {ApiError} - If the team is not found or if the requesting user is not the team owner.
   * @throws {ApiError} - If the team name is already taken.
   * @throws {ApiError} - If the team member limit is exceeded.
   * @returns {Promise<ITeam>} - A promise that resolves to the updated team.
   */
  async updateTeam(data: updateTeamInput): Promise<ITeam> {
    const { teamId, requesterId, ...updates } = data;

    const team = await this.findActiveTeam(teamId);
    this.assertOwner(team, requesterId);

    if (updates.name && updates.name !== team.name) {
      const exists = await Team.findOne({
        name: { $regex: new RegExp(`^${updates.name}$`, "i") },
        _id: { $ne: teamId },
      });

      if (exists) {
        throw new ApiError(409, "Team name already taken");
      }
    }

    if (
      updates.maxMembers !== undefined &&
      updates.maxMembers < team.members.length
    ) {
      throw new ApiError(400, "Team member limit exceeded");
    }

    Object.assign(team, updates);
    await team.save({ validateBeforeSave: false });

    return team;
  }

  /**
   * Generate a join code for a team. Only the team owner can generate a join code.
   * @param teamId - The ID of the team to generate a join code for.
   * @param requesterId - The ID of the user requesting to generate a join code.
   * @returns A promise resolving to the generated join code.
   */
  async generateJoinCode(
    teamId: string,
    requesterId: Types.ObjectId
  ): Promise<string> {
    const team = await this.findActiveTeam(teamId);

    this.assertOwner(team, requesterId);

    const code = team.generateJoinCode();

    await team.save({ validateBeforeSave: false });

    return code;
  }

  /**
   * Joins a team with the given join code.
   * Only users that are not already in a team can join a team.
   * @param userId - The ID of the user to join the team.
   * @param code - The join code to join the team with.
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 400 - User is already in a team
   * @throws {ApiError} 404 - Invalid join code
   * @throws {ApiError} 403 - Invalid join code
   * @throws {ApiError} 400 - This team is full
   * @throws {ApiError} 409 - You are already a member of this team
   * @returns A promise that resolves to the joined team.
   */
  async joinTeamByCode(userId: Types.ObjectId, code: string): Promise<ITeam> {
    const user = await User.findById(userId).select("teamId username");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.teamId) {
      throw new ApiError(
        400,
        "You are already in a team. Leave you current team first."
      );
    }

    const team = await Team.findOne({
      joinCode: code.toUpperCase(),
      isActive: true,
    });

    if (!team) {
      throw new ApiError(404, "Invalid join code");
    }

    if (!team.isJoinCodeValid(code.toUpperCase())) {
      throw new ApiError(403, "Invalid join code");
    }

    if (team.members.length >= team.maxMembers) {
      throw new ApiError(400, "This team is full");
    }

    // a member guard (shouldn't happen but be safe)
    if (team.members.some((m) => m.toString() === userId.toString())) {
      throw new ApiError(409, "You are already a member of this team");
    }

    team.members.push(userId);
    await team.save({ validateBeforeSave: false });
    await User.findByIdAndUpdate(userId, { teamId: team._id });

    return team;
  }

  /**
   * Invites a user to a team.
   * Only the team owner can invite users to the team.
   * @param teamId - The ID of the team to invite the user to.
   * @param ownerId - The ID of the user that is inviting the target user.
   * @param targetUsername - The username of the user to invite.
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 400 - This team is full
   * @throws {ApiError} 409 - ${targetUsername} is already in a team
   * @throws {ApiError} 409 - ${targetUsername} is already a member of this team
   * @throws {ApiError} 409 - ${targetUsername} is already invited to this team
   * @returns A promise that resolves when the user is invited.
   */
  async inviteUser(
    teamId: string,
    ownerId: Types.ObjectId,
    targetUsername: string
  ): Promise<void> {
    const team = await this.findActiveTeam(teamId);

    this.assertOwner(team, ownerId);

    if (team.members.length >= team.maxMembers) {
      throw new ApiError(400, "This team is full");
    }

    const targetUser = await User.findOne({ username: targetUsername }).select(
      "_id teamId username"
    );

    if (!targetUser) {
      throw new ApiError(404, "User not found");
    }

    if (targetUser.teamId) {
      throw new ApiError(409, `${targetUsername} is already in a team`);
    }

    // already a member ?
    if (team.members.some((m) => m.toString() === targetUser._id.toString())) {
      throw new ApiError(
        409,
        `${targetUsername} is already a member of this team`
      );
    }

    // already invited
    const alreadyInvited = team.invites.some(
      (inv) => inv.user.toString() === targetUser._id.toString()
    );

    if (alreadyInvited) {
      throw new ApiError(
        409,
        `${targetUsername} is already invited to this team`
      );
    }

    team.invites.push({
      user: targetUser._id as Types.ObjectId,
      invitedBy: ownerId,
      invitedAt: new Date(),
    });

    await team.save({ validateBeforeSave: false });
  }

  /**
   * Accepts a pending invite for the given team.
   * @param userId - The ID of the user to accept the invite.
   * @param teamId - The ID of the team to accept the invite for.
   * @throws {ApiError} 404 - User not found
   * @throws {ApiError} 409 - You are already in a team
   * @throws {ApiError} 404 - No pending invite found for this team
   * @throws {ApiError} 400 - Team is now full. Invite has been removed
   * @returns A promise that resolves to the team the user is now a member of.
   */
  async acceptInviteSerive(
    userId: Types.ObjectId,
    teamId: string
  ): Promise<ITeam> {
    const user = await User.findById(userId).select("teamId username");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.teamId) {
      throw new ApiError(409, "You are already in a team");
    }

    const team = await this.findActiveTeam(teamId);

    const inviteIndex = team.invites.findIndex(
      (inv) => inv.user.toString() === userId.toString()
    );

    if (inviteIndex === -1) {
      throw new ApiError(404, "No pending invite found for this team");
    }

    if (team.members.length >= team.maxMembers) {
      // remove the stale invite and inform user
      team.invites.splice(inviteIndex, 1);

      await team.save({ validateBeforeSave: false });

      throw new ApiError(400, "Team is now full. Invite has been removed");
    }

    team.invites.splice(inviteIndex, 1);
    team.members.push(userId);
    await team.save({ validateBeforeSave: false });
    await User.findByIdAndUpdate(userId, { teamId: team._id });

    return team;
  }

  async declineInvite(userId: Types.ObjectId, teamId: string): Promise<void> {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    const inviteIndex = team.invites.findIndex(
      (inv) => inv.user.toString() === userId.toString()
    );

    if (inviteIndex === -1) {
      throw new ApiError(404, "No pending invite found for this team");
    }

    team.invites.splice(inviteIndex, 1);
    await team.save({ validateBeforeSave: false });
  }

  async leaveTeam(userId: Types.ObjectId): Promise<void> {
    const user = await User.findById(userId).select("teamId username");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.teamId) {
      throw new ApiError(400, "You are not in a team");
    }

    const team = await this.findActiveTeam(user.teamId.toString());

    const isOwner = team.owner.toString() === user._id.toString();

    // Remove user from members list
    team.members = team.members.filter(
      (m) => m.toString() !== userId.toString()
    ) as typeof team.members;

    if (isOwner) {
      if (team.members.length === 0) {
        // last member was the owner - disband
        team.isActive = false;
      } else {
        // transfer ownership to the next member (first in list)
        team.owner = team.members[0];
      }
    }

    await team.save({ validateBeforeSave: false });
    await User.findByIdAndUpdate(userId, { teamId: null });
  }

  /**
   * Kicks a member from a team.
   * Only the team owner can kick users from the team.
   * @param teamId - The ID of the team to kick the user from.
   * @param ownerId - The ID of the user that is kicking the target user.
   * @param targetUserId - The ID of the user to kick from the team.
   * @throws {ApiError} 400 - You cannot kick yourself. Use leave team instead.
   * @throws {ApiError} 400 - User is not a member of this team
   * @returns A promise that resolves when the user is kicked from the team.
   */
  async kickMember(
    teamId: string,
    ownerId: Types.ObjectId,
    targetUserId: string
  ): Promise<void> {
    if (ownerId.toString() === targetUserId) {
      throw new ApiError(
        400,
        "You cannot kick yourself. Use leave team instead."
      );
    }

    const team = await this.findActiveTeam(teamId);
    this.assertOwner(team, ownerId);

    const isMember = team.members.some((m) => m.toString() === targetUserId);

    if (!isMember) {
      throw new ApiError(400, "User is not a member of this team");
    }

    team.members = team.members.filter(
      (m) => m.toString() !== targetUserId
    ) as typeof team.members;

    await team.save({ validateBeforeSave: false });
    await User.findByIdAndUpdate(targetUserId, { teamId: null });
  }

  /**
   * Searches for teams based on the given filters.
   * @param filters - The filters to use when searching for teams.
   * @returns A promise that resolves to an object containing the searched teams and metadata.
   * @property teams - The searched teams.
   * @property meta - The metadata of the search.
   * @property meta.total - The total number of teams that match the search.
   * @property meta.page - The current page number of the search.
   * @property meta.limit - The number of teams per page of the search.
   * @property meta.totalPages - The total number of pages of the search.
   * @property meta.hasNext - Whether there is a next page of teams to be searched.
   * @property meta.hasPrev - Whether there is a previous page of teams to be searched.
   */
  async searchTeams(filters: SearchTeamInput) {
    const { q, country, sortBy = "score", sortOrder = "desc" } = filters;

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;
    const dir = sortOrder === "asc" ? 1 : -1;

    // Build $match
    const match: Record<string, unknown> = {
      isActive: true,
      isPrivate: false,
    };

    if (q?.trim()) {
      // Escape special regex chars to prevent ReDoS
      const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      match.name = { $regex: safe, $options: "i" };
    }

    if (country) {
      match.country = country.toUpperCase();
    }

    // memberCount requires $size on the members array inside aggregation.
    // score and createdAt are plain fields — we can use .find() for those,
    // but we use aggregation for ALL cases to keep the code unified and to
    // support a computed memberCount field in the response.
    const sortStage: Record<string, 1 | -1> =
      sortBy === "memberCount"
        ? { memberCount: dir, _id: 1 }
        : { [sortBy]: dir, _id: 1 }; // _id tiebreaker → stable pagination

    // Aggregation pipeline
    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },

      // Add computed memberCount so we can sort by it AND return it cheaply
      {
        $addFields: {
          memberCount: { $size: "$members" },
        },
      },

      // Run count + paginated data in parallel (single round-trip)
      {
        $facet: {
          metadata: [{ $count: "total" }],
          teams: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                name: 1,
                description: 1,
                avatar: 1,
                score: 1,
                memberCount: 1,
                maxMembers: 1,
                country: 1,
                isPrivate: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },

      // Flatten the metadata array
      {
        $project: {
          teams: 1,
          total: { $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0] },
        },
      },
    ];

    const [result] = await Team.aggregate(pipeline);

    const total = result?.total ?? 0;
    const teams = result?.teams ?? [];
    const totalPages = Math.ceil(total / limit);

    return {
      teams,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Admin

  async adminDisbandTeam(teamId: string): Promise<void> {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new ApiError(404, "Team not found");
    }

    const memberIds = team.members;

    team.isActive = false;
    team.members = [] as unknown as typeof team.members;
    team.invites = [] as unknown as typeof team.invites;
    await team.save({ validateBeforeSave: false });

    // Unlink all members in one query
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $set: { teamId: null } }
    );
  }
}

export const teamService = new TeamService();
