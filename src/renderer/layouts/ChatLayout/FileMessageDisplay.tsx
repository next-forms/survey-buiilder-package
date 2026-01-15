import React from 'react';
import { File, FileText, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface FileMessageDisplayProps {
  files: any[];
  className?: string;
}

/**
 * Get icon component based on file extension
 */
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return FileImage;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
    return FileText;
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return FileVideo;
  }
  if (['mp3', 'wav', 'aac', 'm4a', 'ogg'].includes(ext)) {
    return FileAudio;
  }

  return File;
};

/**
 * Component to display uploaded files in chat messages
 * Styled like Telegram/WhatsApp with icons and filenames
 */
export const FileMessageDisplay: React.FC<FileMessageDisplayProps> = ({
  files,
  className,
}) => {
  if (!Array.isArray(files) || files.length === 0) {
    return <p className="text-sm">File uploaded</p>;
  }

  return (
    <div
      className={cn('flex flex-wrap items-center justify-end gap-2', className)}
    >
      {files.map((file, index) => {
        const Icon = getFileIcon(file.name || 'file');
        const fileName = file.name || 'Untitled file';

        return (
          <div
            key={index}
            className="flex flex-col items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg bg-white/15 backdrop-blur-sm w-[calc(33%-0.3rem)] sm:w-[100px]"
            title={fileName}
          >
            <Icon
              className="w-5 h-5 sm:w-8 sm:h-8 shrink-0"
              strokeWidth={1.5}
            />

            <div className="w-full text-center space-y-0.5">
              <p className="text-xs font-medium truncate px-1">{fileName}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
