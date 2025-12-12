import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, SwitchCamera, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageData: string) => void;
}

export const CameraCapture = ({ open, onOpenChange, onCapture }: CameraCaptureProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    onOpenChange(isOpen);
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
      }
    }
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleOpenChange(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Take a Photo</DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-[4/3] bg-black">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-4 flex justify-center gap-4">
          {!capturedImage ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={switchCamera}
                className="h-12 w-12 rounded-full"
              >
                <SwitchCamera className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={capturePhoto}
                className="h-14 w-14 rounded-full btn-primary"
              >
                <Camera className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpenChange(false)}
                className="h-12 w-12 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Retake
              </Button>
              <Button
                onClick={confirmCapture}
                className="gap-2 btn-primary"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
