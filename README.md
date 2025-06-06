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
│   angular.json         # Configuración del proyecto Angular
│   package.json         # Dependencias y scripts
│   tsconfig.json        # Configuración de TypeScript
│   README.md            # Documentación del proyecto
│
├───📂 public             # Archivos estáticos (favicon, index.html, etc.)
├───📂 src
│   ├───📂 app
│   │   ├───📂 components
│   │   │   ├───📂 graph           # Componente principal del grafo
│   │   │   ├───📂 graph-drawer    # Renderizado SVG interactivo con D3.js
│   │   │   └───📂 graph-menu      # Panel de control del grafo
│   │   ├───📂 services
│   │   │   ├───📂 bandage         # Comunicación con microservicio Bandage
│   │   │   ├───📂 graph           # Comunicación con backend (estructura)
│   │   │   └───📂 graph-state     # Estado reactivo con Angular Signals
│   │   └───📂 utils               # Funciones auxiliares para procesamiento
│   └───📂 environments            # Configuración de entornos Angular
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
Edita `src/environments/environment.ts` para configurar la URL del backend:  
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

---

## **🚀 Modos de Ejecución**  

### **🔹 Desarrollo (Hot Reload)**
```bash
ng serve
```
📌 Disponible en: [http://localhost:4200](http://localhost:4200)

### **🔹 Producción**
```bash
ng build --configuration=production
```
📌 Archivos generados en `dist/tft-frontend/`.

---

## **📌 Tecnologías Usadas**  

- **Angular 19** (con Standalone Components)  
- **TypeScript**  
- **D3.js** (para visualización SVG de grafos)  
- **RxJS Signals**  
- **SCSS/CSS**  

---

## **📌 Troubleshooting & Debugging**
1. Verifica que el backend (`http://localhost:3000`) esté corriendo  
2. Asegúrate de que `environment.ts` esté bien configurado  
3. Limpia la caché del navegador (`Ctrl + Shift + R`)  
4. Revisa la consola del navegador (`F12 → Console`)  

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

---

## **📜 Licencia**
Este proyecto está bajo la licencia **ISC**. Puedes usarlo y modificarlo libremente.
