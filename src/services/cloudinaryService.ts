export class CloudinaryService {
  static async uploadImage(file: File, folder: string = 'productos'): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error uploading image')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error subiendo imagen a Cloudinary:', error)
      throw new Error('Error al subir la imagen')
    }
  }

  static extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/i)
      return matches ? matches[1] : null
    } catch (error) {
      console.error('Error extrayendo public_id:', error)
      return null
    }
  }
}

export default CloudinaryService
