import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetDir = './src/assets';
const maxWidth = 800;
const quality = 60;

async function compressImages(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await compressImages(filePath);
    } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
      try {
        const originalSize = stat.size;
        const ext = path.extname(file).toLowerCase();
        
        if (ext === '.png') {
          await sharp(filePath)
            .resize(maxWidth)
            .png({ quality: Math.min(quality, 85), compressionLevel: 9 })
            .toFile(filePath + '.temp');
        } else {
          await sharp(filePath)
            .resize(maxWidth)
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toFile(filePath + '.temp');
        }
        
        fs.renameSync(filePath + '.temp', filePath);
        const newSize = fs.statSync(filePath).size;
        const saved = ((originalSize - newSize) / originalSize * 100).toFixed(1);
        console.log(`${file}: ${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (节省 ${saved}%)`);
      } catch (err) {
        console.error(`压缩 ${file} 失败:`, err);
      }
    }
  }
}

compressImages(assetDir).then(() => {
  console.log('图片压缩完成！');
});
