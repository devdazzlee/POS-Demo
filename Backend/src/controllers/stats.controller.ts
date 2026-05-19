import asyncHandler from "../middleware/asyncHandler";
import { StatsService } from "../services/stats.service";
import { ApiResponse } from "../utils/apiResponse";

const statsService = new StatsService();

export const dashboardStats = asyncHandler(async (req, res) => {
    const stats = await statsService.getDashboardStats();
    new ApiResponse(stats, 'Dashboard stats fetched', 200).send(res);
})