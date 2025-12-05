# Qwen Coder - Flujo de Trabajo Multiagente

Este directorio contiene una implementación de un flujo de trabajo multiagente especializado para el desarrollo de software, utilizando `qwen-coder` como el modelo principal para la generación de código.

## Estructura

- `agentes/`: Contiene los archivos de configuración JSON para cada uno de los agentes especializados.
- `config.json`: Define la configuración del equipo de agentes, sus roles y el flujo de trabajo.
- `run_workflow.sh`: Un script de shell para iniciar el flujo de trabajo con una tarea de ejemplo.

## Agentes

El equipo está compuesto por los siguientes roles:

1.  **Project Manager (`project_manager.json`):**
    - **Responsabilidad:** Recibe el requisito inicial del usuario, lo descompone en pasos claros y asigna las tareas a los otros agentes. Supervisa el progreso general.

2.  **Coder (`coder.json`):**
    - **Responsabilidad:** Escribir el código fuente para cumplir con los requisitos técnicos definidos por el Project Manager.
    - **Modelo:** Utiliza `qwen-coder` para una generación de código de alta calidad.

3.  **Reviewer (`reviewer.json`):**
    - **Responsabilidad:** Analizar el código generado por el Coder para identificar bugs, inconsistencias de estilo, o posibles mejoras de rendimiento y lógica. Proporciona feedback para la iteración.

4.  **Documenter (`documenter.json`):**
    - **Responsabilidad:** Escribir documentación clara y concisa para el código final, incluyendo explicaciones de funciones, parámetros y ejemplos de uso.

## Uso

Para ejecutar el flujo de trabajo, utiliza el script `run_workflow.sh`. Puedes modificar el prompt dentro de este script para asignarle una nueva tarea al equipo.

```bash
cd proyectos/qwen_coder_workflow
./run_workflow.sh
```
