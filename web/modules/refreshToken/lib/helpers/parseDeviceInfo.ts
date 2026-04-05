import { DeviceInfo, SessionInfo } from "../../types/refreshToken.types";
import { parseBrowser } from "./parseBrowser";
import { parseOS } from "./parseOS";

/**
 * Parse a SessionInfo object into a DeviceInfo object.
 *
 * @param session - SessionInfo object to parse
 * @returns DeviceInfo object with parsed information
 */
export function parseDeviceInfo(session: SessionInfo): DeviceInfo {
  return {
    sessionId: session._id,
    browser: parseBrowser(session.userAgent),
    os: parseOS(session.userAgent),
    ip: session.ipAddress,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    isCurrent: session.isCurrent,
    isExpired: new Date(session.expiresAt) < new Date(),
  };
}