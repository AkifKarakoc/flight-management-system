/**
 * Export Utilities for Flight Management System
 * Provides functionality to export data as PDF, Excel, CSV and images
 */

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import type {
  Flight,
  KpiData,
  SystemStatusItem
} from '@/types'

// jsPDF AutoTable type declaration
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Export format types
type ExportFormat = 'pdf' | 'excel' | 'csv'
type ChartFormat = 'png' | 'jpg' | 'jpeg' | 'webp'
type OrientationType = 'portrait' | 'landscape'
type PageFormat = 'a4' | 'a3' | 'letter' | 'legal'

// Configuration interfaces
interface MarginConfig {
  top: number
  right: number
  bottom: number
  left: number
}

interface PDFConfig {
  format: PageFormat
  orientation: OrientationType
  margin: MarginConfig
  fontSize: number
  font: string
  title?: string
  subtitle?: string
  footer?: string
  metadata?: Record<string, string | number>
  columns?: string[]
  columnLabels?: Record<string, string>
  columnStyles?: Record<string, any>
}

interface ExcelConfig {
  sheetName: string
  bookType: string
  columnWidths?: number[]
  headers?: boolean
  metadata?: {
    title?: string
    subject?: string
    author?: string
  }
}

interface CSVConfig {
  delimiter: string
  encoding: string
  columns?: string[]
  columnLabels?: Record<string, string>
}

interface ChartConfig {
  format: ChartFormat
  quality: number
  width: number
  height: number
  backgroundColor: string
}

interface DefaultOptions {
  pdf: PDFConfig
  excel: ExcelConfig
  csv: CSVConfig
}

// Dashboard data interfaces
interface DashboardKpis {
  totalFlights: number
  activeAirlines: number
  totalAirports: number
  activeAircrafts: number
}

interface DashboardData {
  kpis?: DashboardKpis
  recentFlights?: Flight[]
  systemStatus?: SystemStatusItem[]
  alerts?: Array<{
    id: number
    type: string
    message: string
    timestamp: string
  }>
}

// Export result interface
interface ExportResult {
  blob: Blob
  filename: string
}

// Flight export specific interface
interface FlightExportData {
  flightNumber: string
  airline: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  status: string
    [key: string]: any
}

// Report data interface for dashboard
interface ReportData {
  'Metrik': string
  'Değer': string | number
}

class ExportService {
  private readonly defaultOptions: DefaultOptions

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
   */
  async exportToPDF(data: Record<string, any>[], options: Partial<PDFConfig> = {}): Promise<Blob> {
    const config: PDFConfig = { ...this.defaultOptions.pdf, ...options }

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
   */
  async exportToExcel(
    data: Record<string, any>[] | Record<string, Record<string, any>[]>,
    options: Partial<ExcelConfig> = {}
  ): Promise<Blob> {
    const config: ExcelConfig = { ...this.defaultOptions.excel, ...options }

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
          const range = XLSX.utils.decode_range(worksheet['!ref']!)
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

      return new Promise<Blob>((resolve) => {
        const excelBuffer = XLSX.write(workbook, {
          bookType: config.bookType as XLSX.BookType,
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
   */
  async exportToCSV(data: Record<string, any>[], options: Partial<CSVConfig> = {}): Promise<Blob> {
    const config: CSVConfig = { ...this.defaultOptions.csv, ...options }

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
   */
  async exportChartAsImage(
    chartElement: HTMLCanvasElement | string,
    options: Partial<ChartConfig> = {}
  ): Promise<Blob> {
    const config: ChartConfig = {
      format: 'png',
      quality: 0.9,
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      ...options
    }

    try {
      let dataURL: string

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
   */
  downloadBlob(blob: Blob, filename: string): void {
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
   */
  async exportFlights(
    flights: FlightExportData[],
    format: ExportFormat,
    options: Partial<PDFConfig & ExcelConfig & CSVConfig> = {}
  ): Promise<ExportResult> {
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

    let blob: Blob
    let filename: string

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
   */
  async exportDashboardReport(
    dashboardData: DashboardData,
    format: ExportFormat,
    options: Partial<PDFConfig & ExcelConfig> = {}
  ): Promise<ExportResult> {
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

    let blob: Blob
    let filename: string

    if (format === 'excel') {
      // Multi-sheet Excel for dashboard
      const workbookData: Record<string, Record<string, any>[]> = {
        'KPI Özeti': dashboardData.kpis ? [dashboardData.kpis] : [],
        'Son Uçuşlar': dashboardData.recentFlights || [],
        'Sistem Durumu': dashboardData.systemStatus || [],
        'Uyarılar': dashboardData.alerts || []
      }

      blob = await this.exportToExcel(workbookData, exportConfig)
      filename = `${baseFilename}.xlsx`
    } else {
      // For PDF, create a comprehensive report
      const reportData = this.prepareDashboardReportData(dashboardData)
      blob = await this.exportToPDF(reportData, exportConfig)
      filename = `${baseFilename}.pdf`
    }

    this.downloadBlob(blob, filename)
    return { blob, filename }
  }

  /**
   * Prepare dashboard data for PDF report
   */
  private prepareDashboardReportData(dashboardData: DashboardData): ReportData[] {
    const reportData: ReportData[] = []

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
   */
  private formatCellValue(value: any): string {
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

  /**
   * Export reference data (airlines, airports, etc.)
   */
  async exportReferenceData<T extends Record<string, any>>(
  data: T[],
  type: string,
  format: ExportFormat,
  options: Partial<PDFConfig & ExcelConfig & CSVConfig> = {}
): Promise<ExportResult> {
    const timestamp = new Date().toISOString().split('T')[0]
    const baseFilename = `${type}_${timestamp}`

    const exportConfig = {
      title: `${type} Listesi`,
      subtitle: `Toplam ${data.length} kayıt - ${new Date().toLocaleDateString('tr-TR')}`,
      metadata: {
        'Oluşturma Tarihi': new Date().toLocaleString('tr-TR'),
        'Toplam Kayıt': data.length,
        'Veri Tipi': type,
        'Sistem': 'Flight Management System'
      },
      footer: 'Flight Management System © 2025',
      ...options
    }

    let blob: Blob
    let filename: string

    switch (format) {
      case 'pdf':
        blob = await this.exportToPDF(data, exportConfig)
        filename = `${baseFilename}.pdf`
        break
      case 'excel':
        blob = await this.exportToExcel(data, exportConfig)
        filename = `${baseFilename}.xlsx`
        break
      case 'csv':
        blob = await this.exportToCSV(data, exportConfig)
        filename = `${baseFilename}.csv`
        break
      default:
        throw new Error('Desteklenmeyen format')
    }

    this.downloadBlob(blob, filename)
    return { blob, filename }
  }

  /**
   * Export chart with custom data
   */
  async exportChartWithData(
    chartElement: HTMLCanvasElement | string,
    chartData: Record<string, any>[],
    title: string,
    options: Partial<ChartConfig & PDFConfig> = {}
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `grafik_${title.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`

    // Export chart as image
    const imageBlob = await this.exportChartAsImage(chartElement, options)

    // If PDF format is requested, create a PDF with both chart and data
    if (options.format === 'pdf') {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Add title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(title, 20, 20)

      // Add chart image (this would require converting blob to data URL)
      // For now, just add the data table
      if (chartData.length > 0) {
        const headers = Object.keys(chartData[0])
        const tableData = chartData.map(row =>
          headers.map(header => this.formatCellValue(row[header]))
        )

        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: 30,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [64, 158, 255] }
        })
      }

      const pdfBlob = doc.output('blob')
      this.downloadBlob(pdfBlob, `${filename}.pdf`)
      return { blob: pdfBlob, filename: `${filename}.pdf` }
    } else {
      // Download image directly
      this.downloadBlob(imageBlob, `${filename}.${options.format || 'png'}`)
      return { blob: imageBlob, filename: `${filename}.${options.format || 'png'}` }
    }
  }

  /**
   * Validate export data
   */
  private validateExportData(data: any[], minRows: number = 1): boolean {
    if (!Array.isArray(data)) {
      throw new Error('Export verisi array formatında olmalıdır')
    }

    if (data.length < minRows) {
      throw new Error(`En az ${minRows} satır veri gereklidir`)
    }

    return true
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): ExportFormat[] {
    return ['pdf', 'excel', 'csv']
  }

  /**
   * Get supported chart formats
   */
  getSupportedChartFormats(): ChartFormat[] {
    return ['png', 'jpg', 'jpeg', 'webp']
  }
}

// Create singleton instance
export const exportService = new ExportService()

// Export class for testing
export { ExportService }

// Export types
export type {
  ExportFormat,
    ChartFormat,
    PDFConfig,
    ExcelConfig,
    CSVConfig,
    ChartConfig,
    ExportResult,
    DashboardData,
    FlightExportData
}

// Export default instance
export default exportService
