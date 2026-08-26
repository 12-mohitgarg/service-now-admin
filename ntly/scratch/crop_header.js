import fs from 'fs';
import { PNG } from 'pngjs';

const inputPath = '/Users/mohitgarggmail.com/Downloads/internmitra (8)/public/receipt_header.png';

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function () {
    const width = this.width;
    const height = this.height;
    
    // Find the first column from the left that is NOT dark grey/black
    // Dark grey viewer bg typically has R,G,B < 40 and very low variance
    let cropLeft = 0;
    for (let x = 0; x < width; x++) {
      let isDarkGreyColumn = true;
      for (let y = 0; y < height; y++) {
        const idx = (width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];
        const a = this.data[idx + 3];
        
        // If it is not dark grey/black (typically background of screenshot tools)
        // Let's check if the pixel is white or has color (R, G, B > 50 or different from typical dark grey ~30-35)
        if (a > 0 && (r > 50 || g > 50 || b > 50)) {
          isDarkGreyColumn = false;
          break;
        }
      }
      if (!isDarkGreyColumn) {
        cropLeft = x;
        break;
      }
    }
    
    console.log(`Detected dark grey screenshot border width: ${cropLeft} pixels`);
    
    if (cropLeft > 0) {
      // Crop the image by creating a new PNG of size (width - cropLeft) x height
      const croppedPng = new PNG({
        width: width - cropLeft,
        height: height,
      });
      
      for (let y = 0; y < height; y++) {
        for (let x = cropLeft; x < width; x++) {
          const srcIdx = (width * y + x) << 2;
          const dstIdx = ((width - cropLeft) * y + (x - cropLeft)) << 2;
          
          croppedPng.data[dstIdx] = this.data[srcIdx];
          croppedPng.data[dstIdx + 1] = this.data[srcIdx + 1];
          croppedPng.data[dstIdx + 2] = this.data[srcIdx + 2];
          croppedPng.data[dstIdx + 3] = this.data[srcIdx + 3];
        }
      }
      
      croppedPng.pack().pipe(fs.createWriteStream(inputPath))
        .on('finish', () => {
          console.log(`Successfully cropped ${cropLeft} pixels from the left and saved the image.`);
        });
    } else {
      console.log('No dark grey border detected or already cropped.');
    }
  })
  .on('error', (err) => {
    console.error('Error processing PNG:', err);
  });
