import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
    userQuery: string;
    sql: string;
    data: any[];
    timestamp: Date;
}

export function generateChatbotReportPDF(reportData: ReportData): void {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Consulta - Racom POS', 14, 20);

    // Add timestamp
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${reportData.timestamp.toLocaleString('es-MX')}`, 14, 28);

    // Add user query
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('Consulta:', 14, 38);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    const splitQuery = doc.splitTextToSize(reportData.userQuery, 180);
    doc.text(splitQuery, 14, 44);

    const queryHeight = splitQuery.length * 5;

    // Add SQL query (optional, for transparency)
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('SQL ejecutado:', 14, 50 + queryHeight);
    const splitSQL = doc.splitTextToSize(reportData.sql, 180);
    doc.text(splitSQL, 14, 55 + queryHeight);

    const sqlHeight = splitSQL.length * 4;

    // Add data table
    if (reportData.data && reportData.data.length > 0) {
        const columns = Object.keys(reportData.data[0]).map(key => ({
            header: key.replace(/_/g, ' ').toUpperCase(),
            dataKey: key
        }));

        autoTable(doc, {
            startY: 65 + queryHeight + sqlHeight,
            columns: columns,
            body: reportData.data,
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 10 }
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('No se encontraron resultados', 14, 70 + queryHeight + sqlHeight);
    }

    // Add footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Download PDF
    const fileName = `reporte_${new Date().getTime()}.pdf`;
    doc.save(fileName);
}
