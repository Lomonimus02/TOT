
import { useState } from 'react';
import { Upload, X, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  file?: File;
}

interface MediaUploadProps {
  onMediaAdd: (media: MediaItem[]) => void;
  maxFiles?: number;
}

const MediaUpload = ({ onMediaAdd, maxFiles = 5 }: MediaUploadProps) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList) => {
    const validFiles: MediaItem[] = [];
    
    Array.from(files).forEach((file) => {
      if (mediaItems.length + validFiles.length >= maxFiles) {
        toast({
          title: "Превышен лимит файлов",
          description: `Максимум ${maxFiles} файлов`,
          variant: "destructive",
        });
        return;
      }

      if (file.type.startsWith('image/')) {
        validFiles.push({
          type: 'image',
          url: URL.createObjectURL(file),
          file
        });
      } else if (file.type.startsWith('video/')) {
        validFiles.push({
          type: 'video',
          url: URL.createObjectURL(file),
          file
        });
      } else {
        toast({
          title: "Неподдерживаемый формат",
          description: "Поддерживаются только изображения и видео",
          variant: "destructive",
        });
      }
    });

    if (validFiles.length > 0) {
      const newMediaItems = [...mediaItems, ...validFiles];
      setMediaItems(newMediaItems);
      onMediaAdd(newMediaItems);
    }
  };

  const removeMedia = (index: number) => {
    const newMediaItems = mediaItems.filter((_, i) => i !== index);
    setMediaItems(newMediaItems);
    onMediaAdd(newMediaItems);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-4">
      {/* Зона загрузки */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-yellow-400 bg-yellow-400/10'
            : 'border-gray-600 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-400 mb-2">
          Перетащите файлы сюда или нажмите для выбора
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Поддерживаются изображения и видео (макс. {maxFiles} файлов)
        </p>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          id="media-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('media-upload')?.click()}
          className="text-white border-gray-600 hover:bg-gray-700"
        >
          Выбрать файлы
        </Button>
      </div>

      {/* Превью загруженных файлов */}
      {mediaItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mediaItems.map((item, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={`Загруженное изображение ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-400" />
                    <video
                      src={item.url}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                    />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-2 left-2">
                {item.type === 'image' ? (
                  <Image className="w-4 h-4 text-white" />
                ) : (
                  <Video className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
