import Cropper from 'react-easy-crop';
import React, { useState } from 'react';
import { getCroppedImg } from '@/lib/cropImage';

const CropModal = ({ imageSrc, onCancel, onCrop }: any) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleDone = async () => {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCrop(croppedImage);
  };

  return (
    <div className="bg-black/50 flex items-center justify-center z-[100] w-full min-h-100">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] max-w-md space-y-4 relative">
        <div className="relative w-full h-[300px] bg-gray-100 rounded overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;
