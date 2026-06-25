const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const distAssets = path.join(__dirname, 'dist', 'assets');

async function compressImages() {
  const files = fs.readdirSync(distAssets);
  const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  
  for (const file of imageFiles) {
    const filePath = path.join(distAssets, file);
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    
    // 只压缩大于500KB的图片
    if (sizeKB > 500) {
      console.log(`压缩 ${file} (${Math.round(sizeKB)}KB)...`);
      
      try {
        if (file.endsWith('.png')) {
          // PNG转为JPEG格式会更小
          const outputPath = filePath.replace('.png', '.jpg');
          await sharp(filePath)
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(outputPath);
          
          // 删除原PNG文件
          fs.unlinkSync(filePath);
          console.log(`  -> 转换为JPEG: ${Math.round(fs.statSync(outputPath).size / 1024)}KB`);
        } else {
          // JPEG压缩
          await sharp(filePath)
            .jpeg({ quality: 75, mozjpeg: true })
            .toFile(filePath + '.tmp');
          fs.unlinkSync(filePath);
          fs.renameSync(filePath + '.tmp', filePath);
          console.log(`  -> 压缩后: ${Math.round(fs.statSync(filePath).size / 1024)}KB`);
        }
      } catch (err) {
        console.error(`  压缩失败: ${err.message}`);
      }
    }
  }
  
  console.log('压缩完成！');
}

compressImages();