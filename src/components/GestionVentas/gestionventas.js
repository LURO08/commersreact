import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import './SalesList.css'; // Archivo CSS para estilos
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

function SalesList() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const salesTableRef = useRef(null);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const salesSnapshot = await getDocs(collection(db, "orders"));
                const salesData = salesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSales(salesData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching sales: ", error);
            }
        };

        fetchSales();
    }, []);

    const handleShowDetails = (sale) => {
        setSelectedSale(sale);
    };

    const handleCloseDetails = () => {
        setSelectedSale(null);
    };

    const handleExportToPDF = () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.setFontSize(18);
        pdf.text("DETALLE VENTAS", 10, 15);
        
        let y = 25; // Posición inicial para escribir en el PDF
        
        sales.forEach((sale, index) => {
            // Información de la venta
            pdf.setFontSize(14);
            pdf.text(`Venta ID: ${sale.id}`, 10, y);
            y += 7;
        
            pdf.setFontSize(12);
            pdf.text(`Usuario: ${sale.User}`, 10, y);
            y += 5;
        
            pdf.text(`Total: $${sale.total.toFixed(2)}`, 10, y);
            y += 5;
        
            pdf.text(`Timestamp: ${new Date(sale.timestamp).toLocaleString()}`, 10, y);
            y += 10;
        
            // Detalles de productos comprados
            pdf.setFontSize(12);
            pdf.text("Productos Comprados:", 10, y);
            y += 5;
        
            const productsData = sale.items.map(item => {
                const totalPrice = item.price * item.quantity;
                return [item.name, item.price, item.quantity, `$${totalPrice.toFixed(2)}`];
            }); // Convertir datos de productos a matriz
            
            pdf.autoTable({
                startY: y,
                head: [['Nombre', 'Precio Unitario', 'Cantidad', 'Precio Total']], // Cabecera de la tabla
                body: productsData, // Datos de productos
                theme: 'grid', // Estilo de la tabla
                styles: {
                    fontSize: 10,
                    cellPadding: 2,
                    textColor: [0, 0, 0], // Color de texto negro
                    halign: 'center', // Alineación izquierda
                    valign: 'middle', // Alineación vertical centrada
                    lineWidth: 0.1, // Ancho de línea de borde
                },
            });
        
            y = pdf.autoTable.previous.finalY + 10; // Ajustar la posición y para la próxima sección
        });
        
        // Calcular el precio total de todas las ventas
        const totalSalesPrice = sales.reduce((acc, sale) => acc + sale.total, 0);
        
        // Imprimir el precio total de todas las ventas
        pdf.setFontSize(12);
        pdf.text(`Precio Total de Todas las Ventas: $${totalSalesPrice.toFixed(2)}`, 10, y + 10);
        
        pdf.save("sales_list.pdf");
    };
    
    
    
    
    

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="sales-container">
            <div className="sales-table" ref={salesTableRef}>
                <h1>Sales List</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Compra ID</th>
                            <th>Usuario</th>
                            <th>Productos Comprados</th>
                            <th>Total</th>
                            <th>Timestamp</th>
                            <th>Detalles</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => (
                            <tr key={sale.id}>
                                <td>{sale.id}</td>
                                <td>{sale.User}</td>
                                <td>{sale.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                                <td>${sale.total.toFixed(2)}</td>
                                <td>{new Date(sale.timestamp).toLocaleString()}</td>
                                <td>
                                    <button onClick={() => handleShowDetails(sale)}>Ver Detalles</button>
                                </td>A2
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='ExportarPDF'>
                    <button className="export-button" onClick={handleExportToPDF}>Exportar a PDF</button>
                </div>

            </div>
            {selectedSale && (
                <div className="details-sidebar">
                    <h2>Detalles de la Venta</h2>
                    <p><strong>Compra ID:</strong> {selectedSale.id}</p>
                    <p><strong>Usuario:</strong> {selectedSale.User}</p>
                    <p><strong>Total:</strong> ${selectedSale.total.toFixed(2)}</p>
                    <p><strong>Timestamp:</strong> {new Date(selectedSale.timestamp).toLocaleString()}</p>
                    <h3>Productos Comprados:</h3>
                    <ul>
                        {selectedSale.items.map(item => (
                            <li key={item.id}>
                                {item.name} - Cantidad: {item.quantity} - Precio: ${item.price.toFixed(2)}
                            </li>
                        ))}
                    </ul>
                    <button className="close-button" onClick={handleCloseDetails}>Cerrar Detalles</button>
                </div>
            )}
        </div>
    );
}

export default SalesList;
