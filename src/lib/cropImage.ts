// @ts-nocheck
import loadImage from 'blueimp-load-image';

export const getCroppedImg = (imageSrc: string, crop: any): Promise<Blob> => {
  return new Promise((resolve) => {
    loadImage(
      imageSrc,
      (canvas: HTMLCanvasElement) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg');
      },
      {
        crop,
        canvas: true,
      }
    );
  });
};
