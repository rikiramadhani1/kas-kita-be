import Jimp from "jimp";
import exifr from "exifr";

/**
 * Reject jika gambar berasal dari kamera
 */
export async function rejectIfCameraPhoto(imagePath: string) {
  const exif = await exifr.parse(imagePath, {
    pick: ["Make", "Model", "LensModel"],
  });

  if (exif?.Make || exif?.Model || exif?.LensModel) {
    console.log("Image hasil jepretan kamera")
    throw new Error(
      "Bukti transfer harus berupa screenshot, bukan foto hasil jepretan kamera"
    );
  }
}

/**
 * Validasi rasio & resolusi screenshot
 */
export function validateScreenshotDimension(image: Jimp) {
  const { width, height } = image.bitmap;
  const ratio = width / height;

  const validRatios = [9 / 16, 9 / 18, 9 / 20];
  const ratioValid = validRatios.some(r => Math.abs(ratio - r) < 0.05);

  if (!ratioValid || width < 720 || height < 1280) {
    console.log("mungkin hasil kirim screenshoot ke hp lain")
    throw new Error("Gambar tidak menyerupai screenshot bukti transfer");
  }
}

/**
 * Validasi apakah gambar mengandung elemen UI / teks
 */
export function validateEdgeDensity(image: Jimp) {
  let edges = 0;
  const threshold = 20;

  image.scan(1, 1, image.bitmap.width - 2, image.bitmap.height - 2, function (
    _x,
    _y,
    idx
  ) {
    const c = this.bitmap.data[idx];
    const right = this.bitmap.data[idx + 4];
    const down = this.bitmap.data[idx + this.bitmap.width * 4];

    if (Math.abs(c - right) > threshold || Math.abs(c - down) > threshold) {
      edges++;
    }
  });

  const density = edges / (image.bitmap.width * image.bitmap.height);
  if (density < 0.02) {
    console.log("hasil corat-coret wa")
    throw new Error(
      "Gambar tidak mengandung teks atau elemen UI bukti transfer"
    );
  }
}
