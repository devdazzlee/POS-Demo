import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { ReportsService } from '../services/reports.service';
import { ApiResponse } from '../utils/apiResponse';

const reportsService = new ReportsService();

/**
 * Get reports data (sales, products, stats)
 */
export const getReportsData = asyncHandler(async (req: Request, res: Response) => {
  const branchId = req.user?.branch_id as string | undefined;
  const userRole = req.user?.role as string | undefined;
  const { limit } = req.query;

  const [sales, bestSellingProducts, stats] = await Promise.all([
    reportsService.getSalesForReports({ branchId, userRole }),
    reportsService.getBestSellingProducts({
      branchId,
      userRole,
      limit: limit ? Number(limit) : 10,
    }),
    reportsService.getReportsStats({ branchId, userRole }),
  ]);

  new ApiResponse(
    {
      sales,
      bestSellingProducts,
      stats,
    },
    'Reports data fetched successfully'
  ).send(res);
});

