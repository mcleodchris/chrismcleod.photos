import Image from '@11ty/eleventy-img';
import path from 'node:path';

const stringifyAttributes = attributeMap => {
  return Object.entries(attributeMap)
    .map(([attribute, value]) => {
      if (typeof value === 'undefined') return '';
      return `${attribute}="${value}"`;
    })
    .join(' ');
};

function getFileName(id, src, width, format, options) {
  // id: hash of the original image
  // src: original image path
  // width: current width in px
  // format: current file format
  // options: set of options passed to the Image call
  const path = src.split('/');
  const filename = path.pop().split('.');
  const name = filename[0];

  return `${name}-${width}.${format}`;
}

export const imageShortcode = async (
  src,
  alt = '',
  caption = '',
  loading = 'lazy',
  containerClass,
  imageClass,
  widths = [320, 570, 820],
  sizes = 'auto',
  formats = ['avif', 'webp', 'jpeg']
) => {
  // Prepend "./src" if not present
  if (!src.startsWith('./src') && !src.startsWith('http')) {
    src = `./src${src}`;
  }

  let staticData = {};

  // TODO: This should be a configuration variable somewhere
  const cdnPath = 'https://assets.chrismcleod.dev/chrismcleod.dev/assets/resized';

  formats.forEach(format => {
    staticData[format] = [];
    widths.forEach(width => {
      const fileName = getFileName(null, src, width, format, {});
      staticData[format].push({
        src: `${cdnPath}/${fileName}`,
        width,
        format,
        sourceType: `image/${format}`,
        srcset: `${cdnPath}/${fileName} ${width}w`
      });
    });
  });

  const metadata = /*process.env.ELEVENTY_PRODUCTION*/ true
    ? staticData
    : await Image(src, {
        widths: [...widths],
        formats: [...formats],
        urlPath: '/assets/images/',
        outputDir: './dist/assets/images/',
        filenameFormat: (id, src, width, format, options) => {
          const extension = path.extname(src);
          const name = path.basename(src, extension);
          return `${name}-${width}w.${format}`;
        }
      });

  const lowsrc = metadata.jpeg[metadata.jpeg.length - 1];

  const imageSources = Object.values(metadata)
    .map(imageFormat => {
      return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat
        .map(entry => entry.srcset)
        .join(', ')}" sizes="${sizes}">`;
    })
    .join('\n');

  const imageAttributes = stringifyAttributes({
    'src': lowsrc.src,
    'width': lowsrc.width,
    'height': lowsrc.height,
    alt,
    loading,
    'decoding': loading === 'eager' ? 'sync' : 'async',
    ...(imageClass && {class: imageClass}),
    'eleventy:ignore': ''
  });

  const pictureElement = `<picture> ${imageSources}<img ${imageAttributes}></picture>`;

  return caption
    ? `<figure slot="image"${containerClass ? ` class="${containerClass}"` : ''}>${pictureElement}<figcaption>${caption}</figcaption></figure>`
    : `<picture slot="image"${containerClass ? ` class="${containerClass}"` : ''}>${imageSources}<img ${imageAttributes}></picture>`;
};

export const indiewebImageShortCode = async (
  src,
  alt = '',
  loading = 'lazy',
  imageClass,
  hidden = false,
  widths = [320, 570, 820],
  sizes = 'auto',
) => {
  // Prepend "./src" if not present
  if (!src.startsWith('./src') && !src.startsWith('http')) {
    src = `./src${src}`;
  }

  let staticData = {};
  // TODO: This should be a configuration variable somewhere
  const cdnPath = 'https://assets.chrismcleod.dev/chrismcleod.dev/assets/resized';

  staticData['jpeg'] = [];
  widths.forEach(width => {
    const fileName = getFileName(null, src, width, 'jpeg', {});
    staticData['jpeg'].push({
      src: `${cdnPath}/${fileName}`,
      width,
      format: 'jpeg',
      sourceType: 'image/jpeg',
      srcset: `${cdnPath}/${fileName} ${width}w`
    });
  });

  const metadata = /*process.env.ELEVENTY_PRODUCTION*/ true
    ? staticData
    : await Image(src, {
        widths: [...widths],
        formats: ['jpeg'],
        urlPath: '/assets/images/',
        outputDir: './dist/assets/images/',
        filenameFormat: (id, src, width, format, options) => {
          const extension = path.extname(src);
          const name = path.basename(src, extension);
          return `${name}-${width}w.${format}`;
        }
      });

  const lowsrc = metadata.jpeg[metadata.jpeg.length - 1];

  const imageAttributes = stringifyAttributes({
    'src': lowsrc.src,
    'width': lowsrc.width,
    'height': lowsrc.height,
    alt,
    loading,
    'decoding': loading === 'eager' ? 'sync' : 'async',
    'srcset': metadata.jpeg.map(entry => entry.srcset).join(', '),
    'sizes': sizes,
    ...(imageClass && {class: imageClass}),
    'eleventy:ignore': '',
    ...(hidden ? {hidden: true} : {})
  });

  return `<img ${imageAttributes}>`;
};

