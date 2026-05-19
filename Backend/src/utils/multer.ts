import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const imageFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

export default upload;