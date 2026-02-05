const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Map of sections to images
const sections = [
    {
        title: 'Guía de Usuario - Racom POS & Manda2',
        text: 'Bienvenido a la guía oficial del sistema. Este documento está diseñado para ayudarle a entender y utilizar todas las funciones de su nuevo punto de venta y sistema de gestión, sin necesidad de conocimientos técnicos avanzados.\n\nEl sistema se divide en dos partes principales:\n1. Racom POS: Para realizar ventas en la tienda física.\n2. Manda2: Para recibir pedidos en línea y a domicilio.',
        image: null
    },
    {
        title: '1. Roles de Usuario',
        text: 'El sistema tiene diferentes niveles de acceso:\n\n- Cajero: Puede realizar ventas, ver el catálogo y registrar su consumo.\n- Administrador/Gerente: Tiene acceso total. Puede ver reportes, cambiar configuraciones, gestionar inventario y autorizar acciones sensibles (como el consumo de empleados) usando un PIN de seguridad.',
        image: null
    },
    {
        title: '2. Panel Principal (Dashboard)',
        text: 'Al iniciar sesión, verá el Panel Principal. Desde aquí puede acceder a todas las áreas del sistema.\n\nEn la parte inferior izquierda (o en el menú lateral en móviles) encontrará botones para navegar entre "Ventas", "Inventario", "Reportes", etc.',
        image: 'evidence_dashboard_button_1765066466665.png'
    },
    {
        title: '3. Cómo Realizar una Venta (POS)',
        text: 'El módulo de "Ventas" o "POS" es donde pasará la mayor parte del tiempo. Aquí es donde se cobran los productos a los clientes.',
        image: 'evidence_pos_filters_initial_1765066725732.png'
    },
    {
        title: '3.1 Encontrar Productos',
        text: 'Tiene tres formas de agregar productos a la venta:\n\n1. Escáner: Use su lector de código de barras o la cámara del dispositivo.\n2. Búsqueda: Escriba el nombre del producto (ej. "Coca") en la barra de búsqueda.\n3. Catálogo Visual: Navegue por las categorías (botones superiores) para encontrar productos sin código.',
        image: 'evidence_product_search_filtered_1765068243736.png'
    },
    {
        title: '3.2 Uso de Filtros',
        text: 'Para facilitar la búsqueda, puede usar los botones de filtros:\n- "Todos": Muestra todo el catálogo.\n- "Granel": Muestra solo productos que se venden por peso (frutas, verduras, etc.).\n- Categorías: Filtra por tipo de producto (Bebidas, Sabritas, etc.).',
        image: 'evidence_pos_filters_category_1765066754809.png'
    },
    {
        title: '3.3 Cobrar la Venta',
        text: 'Una vez agregados los productos, presione el botón "Cobrar". Se abrirá una ventana para elegir el método de pago:\n\n- Efectivo: Ingrese la cantidad que le entrega el cliente. El sistema calculará el cambio.\n- Tarjeta: Para pagos con terminal bancaria.\n- Transferencia: Muestra los datos bancarios de la tienda para que el cliente realice el pago.',
        image: 'evidence_transfer_modal_1765065942985.png'
    },
    {
        title: '4. Gestión de Pedidos (Manda2)',
        text: 'El "Monitor de Pedidos" es su centro de control para ventas en línea. Aquí aparecen automáticamente los pedidos que los clientes hacen desde la app Manda2.',
        image: 'evidence_monitor_ui_1765066998461.png'
    },
    {
        title: '4.1 Tipos de Pedido',
        text: 'El monitor le indica claramente qué hacer con cada pedido:\n\n- Delivery (Moto): El pedido debe ser enviado al domicilio del cliente. Verá la dirección en la tarjeta del pedido.\n- Pickup (Bolsa): El cliente pasará a la tienda a recogerlo.\n\nTambién verá si el pedido ya está "PAGADO" o si debe "COBRAR" al entregar.',
        image: 'evidence_monitor_delivery_success_1765067653859.png'
    },
    {
        title: '5. Reportes y Estadísticas',
        text: 'Para los administradores, la sección de Reportes ofrece una visión clara de cómo va el negocio.\n\n- Gráfico de Ventas: Muestra cuánto se ha vendido cada día de la semana.\n- Productos Top: Muestra cuáles son los 5 productos más vendidos.',
        image: 'evidence_reports_charts_1765068662996.png'
    },
    {
        title: '6. Configuración y Seguridad',
        text: 'En el menú "Configuración", puede ajustar detalles importantes como los datos que aparecen en el ticket o la información bancaria.\n\nImportante: En la sección "Seguridad", puede cambiar el PIN de Supervisor. Este PIN es necesario para autorizar consumos de empleados.',
        image: 'evidence_settings_security_1765068715438.png'
    },
    {
        title: '6.1 Consumo de Empleados',
        text: 'Si un empleado desea tomar un producto de la tienda, debe registrarlo en el módulo "Consumo".\n\n1. Seleccione al empleado.\n2. Escanee los productos.\n3. Un supervisor debe ingresar su PIN para autorizar la salida del producto.',
        image: 'evidence_consumption_success_1765068794180.png'
    },
    {
        title: '7. Uso en Celular',
        text: 'El sistema funciona perfectamente en su celular. Puede revisar ventas, inventario o monitorear pedidos desde cualquier lugar.',
        image: 'evidence_1_mobile_list_375x812_retry_1764965834518.png'
    }
];

async function generatePDF() {
    const doc = new jsPDF();
    let y = 20;

    const artifactsDir = '/home/lr/.gemini/antigravity/brain/f8cc4c64-4e14-4c91-956b-361d70113e14';
    const output = path.join(process.cwd(), 'Guia_Usuario_Detallada_RacomPOS.pdf');

    console.log('Generando Guía Detallada...');

    for (const section of sections) {
        // Check if we need a new page
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        // Title
        doc.setFontSize(18);
        doc.setTextColor(0, 51, 102); // Dark Blue
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, 20, y);
        y += 12;

        // Text
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Black
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(section.text, 170);
        doc.text(splitText, 20, y);
        y += (splitText.length * 7) + 10;

        // Image
        if (section.image) {
            const imagePath = path.join(artifactsDir, section.image);
            if (fs.existsSync(imagePath)) {
                try {
                    const imgData = fs.readFileSync(imagePath);
                    const format = 'PNG';

                    const imgProps = doc.getImageProperties(imgData);
                    const pdfWidth = 150; // Slightly smaller to fit nicely
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                    // Check if image fits on page
                    if (y + pdfHeight > 270) {
                        doc.addPage();
                        y = 20;
                    }

                    // Center image
                    const x = (210 - pdfWidth) / 2;
                    doc.addImage(imgData, format, x, y, pdfWidth, pdfHeight);
                    y += pdfHeight + 20;
                } catch (err) {
                    console.error(`Error adding image ${section.image}:`, err);
                }
            } else {
                console.warn(`Image not found: ${imagePath}`);
            }
        }

        y += 10; // Spacing between sections
    }

    doc.save(output);
    console.log(`PDF generado en: ${output}`);
}

generatePDF();
