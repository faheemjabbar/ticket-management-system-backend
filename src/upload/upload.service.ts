import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

@Injectable()
export class UploadService {
  private uploadPath = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFileMetadata(file: Express.Multer.File, userId: string): Promise<FileMetadata> {
    const fileMetadata: FileMetadata = {
      id: file.filename,
      name: file.filename,
      originalName: file.originalname,
      size: file.size,
      type: file.mimetype,
      url: `/uploads/${file.filename}`,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    return fileMetadata;
  }

  async deleteFile(fileId: string): Promise<void> {
    const filePath = path.join(this.uploadPath, fileId);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    fs.unlinkSync(filePath);
  }

  async getFile(fileId: string): Promise<string> {
    const filePath = path.join(this.uploadPath, fileId);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return filePath;
  }
}
