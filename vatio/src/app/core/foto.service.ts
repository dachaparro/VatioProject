import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';

/** Toma y guarda las fotos del medidor en el almacenamiento privado de la app (RF03). */
@Injectable({ providedIn: 'root' })
export class FotoService {
  /** Abre la cámara o la galería. Devuelve la imagen en base64 o null si se cancela. */
  async tomar(origen: 'camara' | 'galeria'): Promise<string | null> {
    try {
      const foto = await Camera.getPhoto({
        quality: 60,
        width: 1000,
        resultType: CameraResultType.Base64,
        source: origen === 'camara' ? CameraSource.Camera : CameraSource.Photos,
        correctOrientation: true,
      });
      return foto.base64String ?? null;
    } catch {
      return null; // el usuario canceló o negó el permiso
    }
  }

  async guardar(id: string, base64: string): Promise<string> {
    const path = `fotos/${id}.jpg`;
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Data, recursive: true });
    return path;
  }

  async cargar(path: string): Promise<string | null> {
    try {
      const { data } = await Filesystem.readFile({ path, directory: Directory.Data });
      if (typeof data === 'string') return `data:image/jpeg;base64,${data}`;
      return URL.createObjectURL(data);
    } catch {
      return null;
    }
  }

  async eliminar(path: string): Promise<void> {
    try {
      await Filesystem.deleteFile({ path, directory: Directory.Data });
    } catch {
      /* ya no existe */
    }
  }

  async eliminarTodas(): Promise<void> {
    try {
      await Filesystem.rmdir({ path: 'fotos', directory: Directory.Data, recursive: true });
    } catch {
      /* no había fotos */
    }
  }
}
