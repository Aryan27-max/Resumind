import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ERROR_MESSAGES, UI_DIMENSIONS } from '~/lib/constants';

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(
            ERROR_MESSAGES.FILE_SIZE_EXCEEDED +
              ` (max ${UI_DIMENSIONS.MAX_FILE_SIZE / (1024 * 1024)}MB)`,
          );
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError(ERROR_MESSAGES.INVALID_FILE_TYPE);
        } else {
          setError('Failed to upload file');
        }
        onFileSelect?.(null);
        return;
      }

      const file = acceptedFiles[0] || null;
      onFileSelect?.(file);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: UI_DIMENSIONS.MAX_FILE_SIZE,
  });

  const file = acceptedFiles[0] ?? null;
  const formatSize = (b: number) =>
    b
      ? `${(b / 1024 ** Math.floor(Math.log(b) / Math.log(1024))).toFixed(2)} ${
          ['Bytes', 'KB', 'MB', 'GB'][Math.floor(Math.log(b) / Math.log(1024))]
        }`
      : '';

  return (
    <div className="w-full gradient-border">
      <div
        {...getRootProps({
          className: `uploader-drag-area ${
            isDragActive ? 'gradient-hover' : 'hover:gradient-hover'
          }`,
        })}
      >
        <input {...getInputProps()} />

        <div className="space-y-4 cursor-pointer">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <img src="/icons/info.svg" alt="upload" className="size-20" />
          </div>

          {file ? (
            <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3">
                <img src="/images/pdf.png" alt="pdf" className="size-10" />
                <div>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect?.(null);
                }}
                className="p-2 cursor-pointer"
              >
                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-lg text-gray-500">
                PDF (max. {UI_DIMENSIONS.MAX_FILE_SIZE / (1024 * 1024)} MB)
              </p>
              {error && <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
