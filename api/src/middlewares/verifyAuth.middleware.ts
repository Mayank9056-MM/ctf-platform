import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/config";
import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import logger from "../utils/logger";

export interface TokenPayload extends JwtPayload {
  _id: string;
}

export const verifyAuth = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const accessToken =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", ""); // if sent from header/mobile

  if (!accessToken) {
    throw new ApiError(401, "Unathorized");
  }

  try {
    const decodedToken = jwt.verify(
      accessToken,
      config.ACCESS_TOKEN_SECRET
    ) as TokenPayload;

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("Error verifying access token", error);
    console.log(error);
    throw new ApiError(401, "Invalid access token");
  }
};
