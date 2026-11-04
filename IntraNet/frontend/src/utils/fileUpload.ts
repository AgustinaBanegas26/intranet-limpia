// Obtiene los datos necesarios.
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    // Gestiona la accion correspondiente.
    reader.onload = () => resolve(reader.result as string)
    // Gestiona la accion correspondiente.
    reader.onerror = () => reject(new Error('failed_to_read_file'))
    reader.readAsDataURL(file)
  })
}

// Obtiene los datos necesarios.
export async function readPdfAsDataUrl(file: File, maxMb = 8): Promise<string> {
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('invalid_file_type')
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error('file_too_large')
  }
  return readFileAsDataUrl(file)
}

/** Redimensiona y comprime una imagen para avatar (JPEG, máx. 512px). */
export async function resizeImageForAvatar(
  file: File,
  maxSize = 512,
  quality = 0.82,
): Promise<string> {
  return resizeImage(file, maxSize, quality)
}

/** Redimensiona imagen para banners del slider principal (JPEG, máx. 1600px). */
export async function resizeImageForSlider(
  file: File,
  maxWidth = 1600,
  quality = 0.88,
): Promise<string> {
  return resizeImage(file, maxWidth, quality)
}

// Gestiona la operacion resizeImage.
async function resizeImage(file: File, maxSize: number, quality: number): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('invalid_file_type')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('file_too_large')
  }

  const dataUrl = await readFileAsDataUrl(file)

  return new Promise((resolve, reject) => {
    const img = new Image()
    // Gestiona la accion correspondiente.
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas_unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    // Gestiona la accion correspondiente.
    img.onerror = () => reject(new Error('invalid_image'))
    img.src = dataUrl
  })
}
