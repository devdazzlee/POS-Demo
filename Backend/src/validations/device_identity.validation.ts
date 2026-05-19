import { z } from "zod";

const deviceIdentitySchema = z.object({
    body: z.object({
        fcm_token: z.string().min(1, 'FCM Token is required'),
    }),
});

export {
    deviceIdentitySchema
};