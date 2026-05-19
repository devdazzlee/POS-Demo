import { Response } from 'express';

class ApiResponse<T> {
  constructor(
    public data: T | null,
    public message: string,
    public statusCode: number = 200,
    public success: boolean = true,
    public meta?: any,
  ) {}

  send(res: Response) {
    const response: any = {
      success: this.success,
      message: this.message,
      data: this.data,
    };
    
    if (this.meta) {
      response.meta = this.meta;
    }
    
    return res.status(this.statusCode).json(response);
  }
}

export { ApiResponse };
