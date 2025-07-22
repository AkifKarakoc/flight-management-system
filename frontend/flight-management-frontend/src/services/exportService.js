/**
 * Export Utilities for Flight Management System
 * Provides functionality to export data as PDF, Excel, CSV and images
 */

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

class ExportService {
  constructor() {
    this.defaultOptions = {
      pdf: {
        format: 'a4',
        orientation: 'portrait',
        margin: { top: 20, right: 14, bottom: 20, left: 14 },
        fontSize: 10,
        font: 'helvetica'
      },
      excel: {
        sheetName: 'Data',
        bookType: 'xlsx'
      },
      csv: {
        delimiter: ',',
        encoding: 'utf-8'
      }
    }
  }

  /**
   * Export data to PDF
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportToPDF(data, options = {}) {
    const config = { ...this.defaultOptions.pdf, ...options }

    try {
      const doc = new jsPDF({
        orientation: config.orientation,
        unit: 'mm',
        format: config.format
      })

      // Set font
      doc.setFont(config.font)
      doc.setFontSize(config.fontSize)

      // Add title
      if (config.title) {
        doc.setFontSize(16)
        doc.setFont(config.font, 'bold')
        doc.text(config.title, config.margin.left, config.margin.top)

        // Add subtitle if provided
        if (config.subtitle) {
          doc.setFontSize(12)
          doc.setFont(config.font, 'normal')
          doc.text(config.subtitle, config.margin.left, config.margin.top + 10)
        }
      }

      // Add metadata
      if (config.metadata) {
        let yPosition = config.margin.top + (config.title ? 25 : 10)
        doc.setFontSize(8)
        doc.setFont(config.font, 'italic')

        Object.entries(config.metadata).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, config.margin.left, yPosition)
          yPosition += 5
        })
      }

      // Prepare table data
      if (Array.isArray(data) && data.length > 0) {
        const headers = config.columns || Object.keys(data[0])
        const tableData = data.map(row =>
          headers.map(header => this.formatCellValue(row[header]))
        )

        // Add table
        doc.autoTable({
          head: [headers.map(h => config.columnLabels?.[h] || h)],
          body: tableData,
          startY: config.margin.top + (config.title ? 40 : 20),
          margin: config.margin,
          styles: {
            fontSize: config.fontSize,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [64, 158, 255],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          columnStyles: config.columnStyles || {}
        })
      }

      // Add footer
      if (config.footer) {
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          doc.setFontSize(8)
          doc.setFont(config.font, 'normal')
          doc.text(
            config.footer,
            config.margin.left,
            doc.internal.pageSize.height - config.margin.bottom
          )
          doc.text(
            `Sayfa ${i} / ${pageCount}`,
            doc.internal.pageSize.width - config.margin.right - 20,
            doc.internal.pageSize.height - config.margin.bottom
          )
        }
      }

      return doc.output('blob')
    } catch (error) {
      console.error('PDF export error:', error)
      throw new Error('PDF oluşturulurken hata oluştu')
    }
  }

  /**
   * Export data to Excel
   * @param {Array|Object} data - Data to export (can be multiple sheets)
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportToExcel(data, options = {}) {
    const config = { ...this.defaultOptions.excel, ...options }

    try {
      const workbook = XLSX.utils.book_new()

      if (Array.isArray(data)) {
        // Single sheet
        const worksheet = XLSX.utils.json_to_sheet(data)

        // Apply column widths
        if (config.columnWidths) {
          worksheet['!cols'] = config.columnWidths.map(width => ({ wch: width }))
        }

        // Apply styles (basic styling)
        if (config.headers && data.length > 0) {
          const range = XLSX.utils.decode_range(worksheet['!ref'])
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
            if (worksheet[cellAddress]) {
              worksheet[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "409EFF" } },
                alignment: { horizontal: "center" }
              }
            }
          }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName)
      } else {
        // Multiple sheets
        Object.entries(data).forEach(([sheetName, sheetData]) => {
          const worksheet = XLSX.utils.json_to_sheet(sheetData)
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        })
      }

      // Add metadata
      if (config.metadata) {
        workbook.Props = {
          Title: config.metadata.title || 'Export',
          Subject: config.metadata.subject || 'Flight Management Data',
          Author: config.metadata.author || 'Flight Management System',
          CreatedDate: new Date()
        }
      }

      return new Promise((resolve) => {
        const excelBuffer = XLSX.write(workbook, {
          bookType: config.bookType,
          type: 'array'
        })
        resolve(new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }))
      })
    } catch (error) {
      console.error('Excel export error:', error)
      throw new Error('Excel dosyası oluşturulurken hata oluştu')
    }
  }

  /**
   * Export data to CSV
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportToCSV(data, options = {}) {
    const config = { ...this.defaultOptions.csv, ...options }

    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Geçersiz veri formatı')
      }

      const headers = config.columns || Object.keys(data[0])
      const csvHeaders = headers.map(h => config.columnLabels?.[h] || h)

      let csvContent = csvHeaders.join(config.delimiter) + '\n'

      data.forEach(row => {
        const csvRow = headers.map(header => {
          const value = this.formatCellValue(row[header])
          // Escape quotes and wrap in quotes if necessary
          if (typeof value === 'string' && (value.includes(config.delimiter) || value.includes('\n') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csvContent += csvRow.join(config.delimiter) + '\n'
      })

      return new Blob([csvContent], {
        type: `text/csv;charset=${config.encoding}`
      })
    } catch (error) {
      console.error('CSV export error:', error)
      throw new Error('CSV dosyası oluşturulurken hata oluştu')
    }
  }

  /**
   * Export chart as image
   * @param {HTMLCanvasElement|string} chartElement - Chart canvas element or data URL
   * @param {Object} options - Export options
   * @returns {Promise<Blob>}
   */
  async exportChartAsImage(chartElement, options = {}) {
    const config = {
      format: 'png',
      quality: 0.9,
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      ...options
    }

    try {
      let dataURL

      if (typeof chartElement === 'string') {
        dataURL = chartElement
      } else if (chartElement instanceof HTMLCanvasElement) {
        dataURL = chartElement.toDataURL(`image/${config.format}`, config.quality)
      } else {
        throw new Error('Geçersiz grafik elementi')
      }

      // Convert data URL to blob
      const response = await fetch(dataURL)
      return await response.blob()
    } catch (error) {
      console.error('Chart image export error:', error)
      throw new Error('Grafik resmi oluşturulurken hata oluştu')
    }
  }

  /**
   * Download blob as file
   * @param {Blob} blob - Blob to download
   * @param {string} filename - File name
   */
  downloadBlob(blob, filename) {
    try {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('Download error:', error)
      throw new Error('Dosya indirme işlemi başarısız')
    }
  }

  /**
   * Export flights data with multiple formats
   * @param {Array} flights - Flights data
   * @param {string} format - Export format (pdf, excel, csv)
   * @param {Object} options - Export options
   */
  async exportFlights(flights, format, options = {}) {
    const timestamp = new Date().toISOString().split('T')[0]
    const baseFilename = `ucuslar_${timestamp}`

    const exportConfig = {
      title: 'Uçuş Listesi',
      subtitle: `Toplam ${flights.length} uçuş - ${new Date().toLocaleDateString('tr-TR')}`,
      metadata: {
        'Oluşturma Tarihi': new Date().toLocaleString('tr-TR'),
        'Toplam Kayıt': flights.length,
        'Sistem': 'Flight Management System'
      },
      columns: ['flightNumber', 'airline', 'origin', 'destination', 'departureTime', 'arrivalTime', 'status'],
      columnLabels: {
        flightNumber: 'Uçuş No',
        airline: 'Havayolu',
        origin: 'Kalkış',
        destination: 'Varış',
        departureTime: 'Kalkış Saati',
        arrivalTime: 'Varış Saati',
        status: 'Durum'
      },
      footer: 'Flight Management System © 2025',
      ...options
    }

    let blob
    let filename

    switch (format) {
      case 'pdf':
        blob = await this.exportToPDF(flights, exportConfig)
        filename = `${baseFilename}.pdf`
        break
      case 'excel':
        blob = await this.exportToExcel(flights, exportConfig)
        filename = `${baseFilename}.xlsx`
        break
      case 'csv':
        blob = await this.exportToCSV(flights, exportConfig)
        filename = `${baseFilename}.csv`
        break
      default:
        throw new Error('Desteklenmeyen format')
    }

    this.downloadBlob(blob, filename)
    return { blob, filename }
  }

  /**
   * Export dashboard report
   * @param {Object} dashboardData - Dashboard data
   * @param {string} format - Export format
   * @param {Object} options - Export options
   */
  async exportDashboardReport(dashboardData, format, options = {}) {
    const timestamp = new Date().toISOString().split('T')[0]
    const baseFilename = `dashboard_raporu_${timestamp}`

    const exportConfig = {
      title: 'Dashboard Raporu',
      subtitle: `Sistem Özeti - ${new Date().toLocaleDateString('tr-TR')}`,
      metadata: {
        'Rapor Tarihi': new Date().toLocaleString('tr-TR'),
        'Rapor Tipi': 'Dashboard Özeti',
        'Sistem': 'Flight Management System'
      },
      ...options
    }

    if (format === 'excel') {
      // Multi-sheet Excel for dashboard
      const workbookData = {
        'KPI Özeti': dashboardData.kpis ? [dashboardData.kpis] : [],
        'Son Uçuşlar': dashboardData.recentFlights || [],
        'Sistem Durumu': dashboardData.systemStatus || [],
        'Uyarılar': dashboardData.alerts || []
      }

      const blob = await this.exportToExcel(workbookData, exportConfig)
      const filename = `${baseFilename}.xlsx`
      this.downloadBlob(blob, filename)
      return { blob, filename }
    } else {
      // For PDF, create a comprehensive report
      const reportData = this.prepareDashboardReportData(dashboardData)
      const blob = await this.exportToPDF(reportData, exportConfig)
      const filename = `${baseFilename}.pdf`
      this.downloadBlob(blob, filename)
      return { blob, filename }
    }
  }

  /**
   * Prepare dashboard data for PDF report
   * @param {Object} dashboardData - Dashboard data
   * @returns {Array}
   */
  prepareDashboardReportData(dashboardData) {
    const reportData = []

    // Add KPI summary
    if (dashboardData.kpis) {
      reportData.push({
        'Metrik': 'Toplam Uçuş',
        'Değer': dashboardData.kpis.totalFlights
      })
      reportData.push({
        'Metrik': 'Aktif Havayolları',
        'Değer': dashboardData.kpis.activeAirlines
      })
      reportData.push({
        'Metrik': 'Toplam Havaalanı',
        'Değer': dashboardData.kpis.totalAirports
      })
      reportData.push({
        'Metrik': 'Aktif Uçaklar',
        'Değer': dashboardData.kpis.activeAircrafts
      })
    }

    return reportData
  }

  /**
   * Format cell value for export
   * @param {any} value - Cell value
   * @returns {string}
   */
  formatCellValue(value) {
    if (value === null || value === undefined) {
      return ''
    }

    if (value instanceof Date) {
      return value.toLocaleString('tr-TR')
    }

    if (typeof value === 'boolean') {
      return value ? 'Evet' : 'Hayır'
    }

    return String(value)
  }
}

// Create singleton instance
export const exportService = new ExportService()

// Export class for testing
export { ExportService }

// Export default instance
export default exportService
