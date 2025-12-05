import os
import io

# Nombre del archivo de salida
NOMBRE_ARCHIVO_SALIDA = "contenido_md_combinado.txt"
# Separador
SEPARADOR = "------------------------{nombre_archivo}-------------------"

def combinar_archivos_md():
    """
    Busca archivos .md en el directorio actual y subdirectorios, 
    extrae su contenido y lo combina en un archivo .txt.
    """
    
    # Abrir el archivo de salida en modo escritura ('w')
    # Se usa 'utf-8' para asegurar que los caracteres especiales se manejen correctamente.
    with io.open(NOMBRE_ARCHIVO_SALIDA, 'w', encoding='utf-8') as archivo_salida:
        print(f"Buscando archivos .md en el directorio actual: {os.getcwd()}")
        
        # os.walk genera tuplas de (directorio_actual, subdirectorios, archivos)
        for dirpath, dirnames, filenames in os.walk(os.getcwd()):
            for filename in filenames:
                # Verificar si la extensión es .md
                if filename.endswith(".md"):
                    ruta_completa_md = os.path.join(dirpath, filename)
                    
                    try:
                        # 1. Escribir el separador en el archivo de salida
                        # Se usa os.path.relpath para que el nombre del archivo sea relativo al directorio de ejecución
                        nombre_relativo = os.path.relpath(ruta_completa_md)
                        separador_con_nombre = SEPARADOR.format(nombre_archivo=nombre_relativo)
                        archivo_salida.write(f"\n{separador_con_nombre}\n")
                        
                        # 2. Leer el contenido del archivo .md
                        with io.open(ruta_completa_md, 'r', encoding='utf-8') as archivo_md:
                            contenido = archivo_md.read()
                            
                            # 3. Escribir el contenido en el archivo de salida
                            archivo_salida.write(contenido)
                            
                        print(f"-> Contenido añadido de: {nombre_relativo}")
                        
                    except Exception as e:
                        # Manejo de errores (por ejemplo, permisos o problemas de codificación)
                        print(f"Error al procesar el archivo {ruta_completa_md}: {e}")

    print(f"\n✅ Proceso completado. El contenido combinado está en: **{NOMBRE_ARCHIVO_SALIDA}**")

# Ejecutar la función principal
if __name__ == "__main__":
    combinar_archivos_md()
