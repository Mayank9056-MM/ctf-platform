import mongoose, { Types } from "mongoose";
import Team, { ITeam } from "../../models/team.model";
import { ApiError } from "../../utils/ApiError";
import User from "../../models/user.model";
import { createTeamInput, SearchTeamInput, updateTeamInput } from "./team.type";

class TeamService {
  private async findActiveTeam(
    teamId: string,
    session?: mongoose.ClientSession
  ): Promise<ITeam> {
    const team = await Team.findById(teamId).session(session ?? null);

    if (!team || !team.isActive) {
      throw new ApiError(404, "Team not found");
    }

    return team;
  }

  private assertOwner(team: ITeam, userId: Types.ObjectId): void {
    if (team.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "Only the team owner can perform this action");
    }
  }

  // createTeam

  async createTeam(data: createTeamInput): Promise<ITeam> {
    const { name, description, isPrivate, country, ownerId } = data;

    const session = await mongoose.startSession();

    /*************  ✨ Windsurf Command ⭐  *************/
    /**
   * Creates a new team.
   * @param data The data to create the team with
   * @property {string} name The name of the team

/*******  30470d52-6b12-42bb-abc1-7835c1bff1e8  *******/ try {
      let createdTeam!: ITeam;

      await session.withTransaction(async () => {
        // Read user inside transaction so we see the latest committed state
        const user = await User.findById(ownerId)
          .select("teamId")
          .session(session);

        if (!user) throw new ApiError(404, "User not found");

        if (user.teamId) {
          throw new ApiError(
            400,
            "You are already in a team. Leave your current team first."
          );
        }

        // Case-insensitive name uniqueness check inside the transaction
        // so no concurrent request can sneak a duplicate through
        const existingName = await Team.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
        }).session(session);

        if (existingName) {
          throw new ApiError(400, "Team name already exists");
        }

        // Create team
        const [team] = await Team.create(
          [
            {
              name,
              description,
              isPrivate: isPrivate ?? false,
              country,
              owner: ownerId,
              members: [ownerId],
            },
          ],
          { session }
        );

        // Link user → team
        await User.findByIdAndUpdate(
          ownerId,
          { $set: { teamId: team._id } },
          { session }
        );

        createdTeam = team;
      });

      return createdTeam;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Finds a team by its ID and returns its document.
   * @param teamId The ID of the team to find
   * @param includeInvites Whether to include the team's invites in the result
   * @throws ApiError If the team is not found
   * @returns The team document
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

  async getMyTeam(userId: Types.ObjectId) {
    const user = await User.findById(userId).select("teamId");

    if (!user) throw new ApiError(404, "User not found");
    if (!user.teamId) return null;

    return this.getTeamById(user.teamId.toString(), true);
  }

  // updateTeam

  /**
   * Updates a team with the given data.
   * @param data The data to update the team with
   * @property {string} teamId The ID of the team to update
   * @property {ObjectId}requesterId The ID of the user who is requesting the update
   * @property {string} [name] The new name for the team
   * @property {number} [maxMembers] The new maximum member count for the team
   * @throws ApiError If the team name is already taken, or if the new member limit is below the current member count
   * @returns The updated team document
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

      if (exists) throw new ApiError(409, "Team name already taken");
    }

    if (
      updates.maxMembers !== undefined &&
      updates.maxMembers < team.members.length
    ) {
      throw new ApiError(400, "New member limit is below current member count");
    }

    Object.assign(team, updates);
    await team.save({ validateBeforeSave: false });

    return team;
  }

  // generateJoinCode

  /**
   * Generates a new join code for the given team. This is a protected operation
   * that requires the requester to be the owner of the team.
   * @param teamId The ID of the team to generate a join code for
   * @param requesterId The ID of the user requesting the join code
   * @throws ApiError If the team is not found or if the requester is not the owner
   * @returns The newly generated join code
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

  // joinTeamByCode

  /**
   * Joins a team by the given join code.
   * @param userId The ID of the user joining the team
   * @param code The join code to use
   * @throws ApiError If the user is already in a team, the join code is invalid,
   * the join code has expired, the team is full, or if the user is already a member
   * of the team.
   */
  async joinTeamByCode(userId: Types.ObjectId, code: string): Promise<ITeam> {
    const session = await mongoose.startSession();

    try {
      let joinedTeam!: ITeam;

      await session.withTransaction(async () => {
        const user = await User.findById(userId)
          .select("teamId username")
          .session(session);

        if (!user) throw new ApiError(404, "User not found");

        if (user.teamId) {
          throw new ApiError(
            400,
            "You are already in a team. Leave your current team first."
          );
        }

        // Lock the team document by reading it inside the transaction
        const team = await Team.findOne({
          joinCode: code.toUpperCase(),
          isActive: true,
        }).session(session);

        if (!team) throw new ApiError(404, "Invalid join code");

        if (!team.isJoinCodeValid(code.toUpperCase())) {
          throw new ApiError(403, "Join code has expired");
        }

        // Capacity check AFTER acquiring the transactional read lock
        if (team.members.length >= team.maxMembers) {
          throw new ApiError(400, "This team is full");
        }

        if (team.members.some((m) => m.toString() === userId.toString())) {
          throw new ApiError(409, "You are already a member of this team");
        }

        team.members.push(userId);
        await team.save({ validateBeforeSave: false, session });

        await User.findByIdAndUpdate(
          userId,
          { $set: { teamId: team._id } },
          { session }
        );

        joinedTeam = team;
      });

      return joinedTeam;
    } finally {
      await session.endSession();
    }
  }

  // inviteUser

  /**
   * Invites a user to a team as the given owner.
   * Checks for team capacity, ensures the target user is not already in a team,
   * and that they are not already a member of the team nor already invited.
   * @param teamId The ID of the team to invite to
   * @param ownerId The ID of the owner inviting the user
   * @param targetUsername The username of the user to invite
   * @throws ApiError If the team is full, the target user is already in a team,
   * the target user is already a member of the team, or if the target user is
   * already invited to the team.
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

    if (!targetUser) throw new ApiError(404, "User not found");

    if (targetUser.teamId) {
      throw new ApiError(409, `${targetUsername} is already in a team`);
    }

    if (team.members.some((m) => m.toString() === targetUser._id.toString())) {
      throw new ApiError(
        409,
        `${targetUsername} is already a member of this team`
      );
    }

    if (
      team.invites.some(
        (inv) => inv.user.toString() === targetUser._id.toString()
      )
    ) {
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

  // acceptInvite

  /**
   * Accepts a pending team invite as the given user.
   * This is an atomic operation:
   *   1. Removes the invite from the team's invites list.
   *   2. Adds the user to the team's members list if there is capacity.
   *   3. Updates the user's teamId field to link them to the team.
   * @param userId The ID of the user to accept the invite
   * @param teamId The ID of the team to join
   * @throws ApiError If the user is not found, is already in a team, or if the team is full
   * @returns The updated team document
   */

  async acceptInviteService(
    userId: Types.ObjectId,
    teamId: string
  ): Promise<ITeam> {
    const session = await mongoose.startSession();

    try {
      let updatedTeam!: ITeam;

      await session.withTransaction(async () => {
        const user = await User.findById(userId)
          .select("teamId username")
          .session(session);

        if (!user) throw new ApiError(404, "User not found");

        if (user.teamId) {
          throw new ApiError(409, "You are already in a team");
        }

        const team = await this.findActiveTeam(teamId, session);

        const inviteIndex = team.invites.findIndex(
          (inv) => inv.user.toString() === userId.toString()
        );

        if (inviteIndex === -1) {
          throw new ApiError(404, "No pending invite found for this team");
        }

        // Capacity check INSIDE transaction — guards the last-slot race
        if (team.members.length >= team.maxMembers) {
          // Remove stale invite before aborting
          team.invites.splice(inviteIndex, 1);
          await team.save({ validateBeforeSave: false, session });
          throw new ApiError(400, "Team is now full. Invite has been removed.");
        }

        team.invites.splice(inviteIndex, 1);
        team.members.push(userId);
        await team.save({ validateBeforeSave: false, session });

        await User.findByIdAndUpdate(
          userId,
          { $set: { teamId: team._id } },
          { session }
        );

        updatedTeam = team;
      });

      return updatedTeam;
    } finally {
      await session.endSession();
    }
  }

  // declineInvite

  /**
   * Declines a pending team invite as the given user.
   *
   * @param userId The ID of the user declining the invite
   * @param teamId The ID of the team to decline the invite from
   * @throws ApiError If the user is not found or not in a team
   */
  async declineInvite(userId: Types.ObjectId, teamId: string): Promise<void> {
    const team = await Team.findById(teamId);

    if (!team) throw new ApiError(404, "Team not found");

    const inviteIndex = team.invites.findIndex(
      (inv) => inv.user.toString() === userId.toString()
    );

    if (inviteIndex === -1) {
      throw new ApiError(404, "No pending invite found for this team");
    }

    team.invites.splice(inviteIndex, 1);
    await team.save({ validateBeforeSave: false });
  }

  // leaveTeam

  /**
   * Leaves a team as the given user.
   * This is an atomic operation:
   *   1. Removes the user from the team's members list.
   *   2. If the user was the owner, transfers ownership to the next member or disbands the team if it is empty.
   *   3. Unlinks the user from the team by setting their teamId field to null.
   * @param userId The ID of the user to leave the team
   * @throws ApiError If the user is not found or not in a team
   */
  async leaveTeam(userId: Types.ObjectId): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const user = await User.findById(userId)
          .select("teamId username")
          .session(session);

        if (!user) throw new ApiError(404, "User not found");
        if (!user.teamId) throw new ApiError(400, "You are not in a team");

        const team = await this.findActiveTeam(user.teamId.toString(), session);

        const isOwner = team.owner.toString() === userId.toString();

        // Remove user from members list
        team.members = team.members.filter(
          (m) => m.toString() !== userId.toString()
        ) as typeof team.members;

        if (isOwner) {
          if (team.members.length === 0) {
            // Last member left — disband
            team.isActive = false;
          } else {
            // Transfer ownership to the next member
            team.owner = team.members[0];
          }
        }

        await team.save({ validateBeforeSave: false, session });

        await User.findByIdAndUpdate(
          userId,
          { $set: { teamId: null } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  // kickMember

  /**
   * Kick a member from a team.
   * @param teamId The ID of the team to kick from
   * @param ownerId The ID of the owner kicking the member
   * @param targetUserId The ID of the user to kick from the team
   * @throws ApiError If the owner tries to kick themselves or if the target user is not a member of the team
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

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const team = await this.findActiveTeam(teamId, session);
        this.assertOwner(team, ownerId);

        const isMember = team.members.some(
          (m) => m.toString() === targetUserId
        );

        if (!isMember) {
          throw new ApiError(400, "User is not a member of this team");
        }

        team.members = team.members.filter(
          (m) => m.toString() !== targetUserId
        ) as typeof team.members;

        await team.save({ validateBeforeSave: false, session });

        await User.findByIdAndUpdate(
          targetUserId,
          { $set: { teamId: null } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }

  // searchTeams

  /**
   * Search for teams based on the given filters.
   *
   * @param filters - filters to apply to the search
   * @property {string} [filters.q] - name of the team to search for
   * @property {string} [filters.country] - country of the team to search for
   * @property {"score" | "memberCount"} [filters.sortBy] - field to sort the results by
   * @property {"asc" | "desc"} [filters.sortOrder] - order to sort the results in
   * @property {number} [filters.page] - page number to return
   * @property {number} [filters.limit] - number of teams to return per page
   *
   * @return an object containing the search results and metadata
   * @property {ITeam[]} teams - the teams that match the filters
   * @property {object} meta - metadata about the search results
   * @property {number} meta.total - total number of teams that match the filters
   * @property {number} meta.page - current page number
   * @property {number} meta.limit - number of teams to return per page
   * @property {number} meta.totalPages - total number of pages
   * @property {boolean} meta.hasNext - whether there is a next page
   * @property {boolean} meta.hasPrev - whether there is a previous page
   */
  async searchTeams(filters: SearchTeamInput) {
    const { q, country, sortBy = "score", sortOrder = "desc" } = filters;

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;
    const dir = sortOrder === "asc" ? 1 : -1;

    const match: Record<string, unknown> = {
      isActive: true,
      isPrivate: false,
    };

    if (q?.trim()) {
      const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      match.name = { $regex: safe, $options: "i" };
    }

    if (country) {
      match.country = country.toUpperCase();
    }

    const sortStage: Record<string, 1 | -1> =
      sortBy === "memberCount"
        ? { memberCount: dir, _id: 1 }
        : { [sortBy]: dir, _id: 1 };

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      { $addFields: { memberCount: { $size: "$members" } } },
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

  // adminDisbandTeam

  /**
   * Disbands a team as an administrator.
   * This is an atomic operation:
   *   1. Sets the team's isActive field to false.
   *   2. Clears the team's members and invites arrays.
   *   3. Unlinks all members from the team by setting their teamId field to null.
   * @param teamId The ID of the team to disband
   * @throws ApiError If the team is not found
   */
  async adminDisbandTeam(teamId: string): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const team = await Team.findById(teamId).session(session);

        if (!team) throw new ApiError(404, "Team not found");

        const memberIds = [...team.members]; // snapshot before clearing

        team.isActive = false;
        team.members = [] as unknown as typeof team.members;
        team.invites = [] as unknown as typeof team.invites;

        await team.save({ validateBeforeSave: false, session });

        // Unlink all members atomically in one query
        await User.updateMany(
          { _id: { $in: memberIds } },
          { $set: { teamId: null } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  }
}

export const teamService = new TeamService();
