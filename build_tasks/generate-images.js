import * as fs from "node:fs";
import * as path from "node:path";
import { globSync } from "glob";
import sharp from "sharp";

const config = {
  allowedFormats: ["jpg", "jpeg", "webp", "avif", "png", "gif"],
};

const transforms = [
  {
    // 930x1185 thumbnails for practitioners
    src: "./src/admin/uploads/img/practitioners/",
    dist: "./dist/uploads/img/practitioners/930x1185/",
    formats: ["jpg"],
    options: {
      width: 930,
      height: 1185,
      fit: "cover",
    },
  },
  {
    // 310x395 thumbnails for practitioners
    src: "./src/admin/uploads/img/practitioners/",
    dist: "./dist/uploads/img/practitioners/310x395/",
    formats: ["jpg"],
    options: {
      width: 310,
      height: 395,
      fit: "cover",
    },
  },
  {
    // 1024x786 thumbnails for news
    src: "./src/admin/uploads/img/news/",
    dist: "./dist/uploads/img/news/1024x786/",
    formats: ["jpg"],
    options: {
      width: 1024,
      height: 786,
      fit: "cover",
    },
  },
  {
    // 680x720 for images
    src: "./src/assets/img/",
    dist: "./dist/assets/img/680x720/",
    formats: ["jpg"],
    options: {
      width: 680,
      height: 720,
      fit: "cover",
    },
  },
];

/**
 * Create Directory recursively from path
 */
function createDir(path) {
  // return if dir already exists
  if (fs.existsSync(path)) return;
  // create dir
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (err) {
    throw new Error(err);
  }
}

/**
 * Generate images based on transforms object
 */
async function init() {
  // array for promises
  let sharpPromises = [];

  // loop through transforms
  transforms.forEach(async (transform) => {
    let inputDir = transform.src;
    let outputDir = transform.dist;
    let formats = transform.formats;
    let options = transform.options;

    // check formats is array
    if (!Array.isArray(formats)) {
      throw new Error(`"formats" in transforms should be an array`);
    }

    // check formats are of allowed types
    formats.forEach((el) => {
      if (!config.allowedFormats.includes(el)) {
        throw new Error(
          `Unknown format: "${el}". Allowed formats are: ${config.allowedFormats.toString()}`
        );
      }
    });

    // Get image files in input directory
    let imagesGlob = path.join(
      inputDir,
      `*.{${config.allowedFormats.toString()}}`
    );
    let imagesFiles = globSync(imagesGlob);

    // Create output dir
    createDir(outputDir);

    // loop through all images and create Sharp promises
    imagesFiles.forEach((file) => {
      // Create resized images for each specified formats
      formats.forEach((format) => {
        // get input image name
        let inputFileName = path.parse(file).name;

        // build image output path
        let outputPath = path.join(outputDir, `${inputFileName}.${format}`);

        // bail out if image output path exists
        if (fs.existsSync(outputPath)) return;

        // create sharp promises
        try {
          // resize promise
          let sharpPromise = sharp(file).resize(options).toFile(outputPath);

          // push promise to array
          sharpPromises.push(sharpPromise);
        } catch (err) {
          throw new Error(err);
        }
      });
    });
  });

  // resolve all promises in parallel
  try {
    await Promise.all(sharpPromises);
    console.log(`${sharpPromises.length} resized images generated`);
  } catch (err) {
    throw new Error(err);
  }
}

export default init();