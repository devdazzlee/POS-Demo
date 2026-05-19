import { Prisma } from "@prisma/client";
import { prisma } from '../prisma/client';

class DeviceIdentityService {
    public async addDeviceFcmToken(data: Prisma.DeviceIdentityCreateInput) {
        const device = await prisma.deviceIdentity.create({
            data: { fcm_token: data.fcm_token },
            select: {
                fcm_token: true
            },
        });
        return device;
    }
}

export default DeviceIdentityService;