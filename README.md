# **TFT Frontend - Visualización de Grafos para Ensamblaje de Genomas**  

📌 **Versión**: 1.0.0  
🖥 **Tecnologías**: Angular 19, TypeScript, D3.js  
📜 **Licencia**: ISC  

---

## **📌 Descripción del Proyecto**  
Este frontend forma parte del **proyecto de visualización de grafos para ensamblaje de novo de genomas**, desarrollado en el **Trabajo de Fin de Título** en colaboración con el **Instituto Tecnológico de Canarias (ITC)**.  

El frontend permite visualizar **estructuras de grafos interactivas**, obtenidas desde el backend, utilizando **D3.js para la renderización** y **Angular 19 con Standalone Components** para la arquitectura del proyecto.  

---

## **📂 Estructura del Proyecto**  
```
📂 tft-frontend
│   .gitignore         # Ignorar archivos innecesarios en Git
│   package-lock.json  # Control de versiones de dependencias
│   package.json       # Dependencias y scripts de ejecución
│   README.md          # Documentación del proyecto
│   tsconfig.json      # Configuración de TypeScript
│   angular.json       # Configuración del proyecto Angular
│
├───📂 src
│   │   main.ts        # Punto de entrada principal de Angular
│   │   styles.scss    # Estilos globales
│   │
│   ├───📂 app
│   │   │   app.component.ts    # Componente raíz
│   │   │   app.routes.ts       # Definición de rutas
│   │   │
│   │   ├───📂 services
│   │   │       graph.service.ts  # Servicio para obtener datos del backend
│   │   │
│   │   ├───📂 components
│   │       ├───📂 graph
│   │       │       graph.component.ts  # Componente de visualización de grafos
│   │       │       graph.component.html
│   │       │       graph.component.scss
│   │   
│   │
│   ├───assets        # Archivos estáticos (imágenes, íconos)
│   ├───environments  # Configuración de entornos (dev, prod)
```

---

## **⚡ Instalación y Configuración**  

### **1️⃣ Requisitos Previos**  
- [Node.js](https://nodejs.org/) (Versión recomendada: **22+**)  
- [npm](https://www.npmjs.com/)  
- [Angular CLI](https://angular.io/cli) instalado globalmente:  
  ```bash
  npm install -g @angular/cli
  ```

### **2️⃣ Clonar el Repositorio**  
```bash
git clone https://github.com/EmilioMartel/tft-frontend.git
cd tft-frontend
```

### **3️⃣ Instalar Dependencias**  
```bash
npm install
```

### **4️⃣ Configurar Variables de Entorno**  
Edita `src/environments/environment.ts` para configurar el backend:  
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000' // URL del backend
};
```

---

## **🚀 Modos de Ejecución**  

### **🔹 Desarrollo (Hot Reload)**
Ejecuta el frontend en modo desarrollo con recarga automática:  
```bash
ng serve
```
📌 **Por defecto, estará disponible en:** [`http://localhost:4200`](http://localhost:4200)  

### **🔹 Construcción para Producción**
Compila el frontend optimizado para producción:  
```bash
ng build
```
📌 **Los archivos generados estarán en `dist/tft-frontend`**.  


---


## **📌 Tecnologías Usadas**  

### **🔹 Frontend**
- **Angular 19** (Standalone Components) 🚀  
- **TypeScript** ✅  
- **D3.js** (Visualización de Grafos)  
- **RxJS Signals** (Manejo reactivo de datos)  
- **CSS** (Estilos avanzados)  


---

## **📌 Troubleshooting & Debugging**
Si algo no funciona como esperas:  

1. **Verifica que el backend está corriendo** (`http://localhost:3000`).  
2. **Asegúrate de que las variables de entorno están configuradas**.  
3. **Prueba limpiando la caché del navegador** (`Ctrl + Shift + R`).  
4. **Verifica logs en la consola del navegador (`F12` → Console)**.  

---

## **📌 Información Adicional**
📘 **Trabajo de Fin de Título (TFT01)**  
Este proyecto forma parte del **TFT01** en colaboración con el **Instituto Tecnológico de Canarias (ITC)**.  
Más información:  
- [📄 Documento TFT01](https://drive.google.com/file/d/1emKnprueySC8kMen3JYUOPBANlWkGwCl/view?usp=sharing)  
- [🔬 Instituto Tecnológico de Canarias](https://www.itccanarias.org/)  

---

## **👨‍💻 Autor y Contribuciones**
📌 **Autor**: Emilio Martel Díaz  
🔗 **Colaboradores**: ITC, Universidad de Las Palmas de Gran Canaria (ULPGC)  

Si deseas contribuir, **haz un fork del repositorio y envía un PR**. 🚀  

---

## **📜 Licencia**
Este proyecto está bajo la licencia **ISC**. Puedes usarlo y modificarlo libremente.  
