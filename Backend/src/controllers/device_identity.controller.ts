import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import DeviceIdentityService from "../services/device.service";

const deviceIdentityService = new DeviceIdentityService();

export const addDeviceIdentity = asyncHandler(async (req: Request, res: Response) => {
    const deviceIdentity = await deviceIdentityService.addDeviceFcmToken(req.body);
    new ApiResponse(deviceIdentity, 'Data fetched successfully', 200).send(res);
});

