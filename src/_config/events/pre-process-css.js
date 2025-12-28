import fs from 'node:fs/promises';
import path from 'node:path';
import {glob} from 'glob';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import postcssImportExtGlob from 'postcss-import-ext-glob';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export const preProcessCSS = async () => {
  try {
    // Find all CSS files in src/assets/css/
    const cssFiles = await glob('src/assets/css/**/*.css');

    for (const inputPath of cssFiles) {
      const inputContent = await fs.readFile(inputPath, 'utf8');

      // Determine output paths based on input path
      const paths = [];
      if (inputPath === 'src/assets/css/global/global.css') {
        paths.push('src/_includes/css/global.css');
      } else if (inputPath.includes('src/assets/css/local/')) {
        const baseName = path.basename(inputPath);
        paths.push(`src/_includes/css/${baseName}`);
      }

      if (paths.length === 0) continue;

      // Process the CSS
      const result = await postcss([
        postcssImportExtGlob,
        postcssImport,
        tailwindcss,
        autoprefixer,
        cssnano
      ]).process(inputContent, {from: inputPath});

      // Write the output to all specified paths
      for (const outputPath of paths) {
        await fs.mkdir(path.dirname(outputPath), {recursive: true});
        await fs.writeFile(outputPath, result.css);
      }
    }
  } catch (error) {
    console.error('[preProcessCSS] Error during CSS pre-processing:', error);
    throw error;
  }
};
