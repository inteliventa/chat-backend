#!/usr/bin/env python3
"""
Script para convertir el análisis de Markdown a PDF
"""

import re
from fpdf import FPDF
import markdown2

class PDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        self.set_font('Arial', 'B', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, 'Análisis de Performance - Flujo n8n CL00', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title, level=1):
        """Añadir título de capítulo"""
        self.set_font('Arial', 'B', 16 - (level * 2))
        self.set_text_color(0, 0, 0)
        self.ln(5)
        self.multi_cell(0, 8, title, 0, 'L')
        self.ln(3)

    def chapter_body(self, body):
        """Añadir cuerpo de texto"""
        self.set_font('Arial', '', 10)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 5, body)
        self.ln()

    def add_code_block(self, code):
        """Añadir bloque de código"""
        self.set_fill_color(240, 240, 240)
        self.set_font('Courier', '', 8)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 4, code, 0, 'L', True)
        self.ln()

    def add_table_row(self, data, is_header=False):
        """Añadir fila de tabla"""
        if is_header:
            self.set_font('Arial', 'B', 9)
            self.set_fill_color(200, 200, 200)
        else:
            self.set_font('Arial', '', 8)
            self.set_fill_color(255, 255, 255)

        widths = [45] * len(data)  # Ancho igual para todas las columnas
        for i, item in enumerate(data):
            self.cell(widths[i], 6, str(item)[:30], 1, 0, 'L', True)
        self.ln()

def parse_markdown_to_pdf(md_file, pdf_file):
    """Convertir archivo Markdown a PDF"""

    # Leer archivo markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Crear PDF
    pdf = PDF()
    pdf.add_page()
    pdf.set_font('Arial', '', 10)

    # Procesar línea por línea
    lines = content.split('\n')
    in_code_block = False
    code_buffer = []
    in_table = False
    table_rows = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Bloques de código
        if line.startswith('```'):
            if in_code_block:
                # Fin del bloque de código
                pdf.add_code_block('\n'.join(code_buffer))
                code_buffer = []
                in_code_block = False
            else:
                # Inicio del bloque de código
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            code_buffer.append(line)
            i += 1
            continue

        # Títulos
        if line.startswith('# '):
            pdf.chapter_title(line[2:], level=1)
        elif line.startswith('## '):
            pdf.chapter_title(line[3:], level=2)
        elif line.startswith('### '):
            pdf.chapter_title(line[4:], level=3)
        elif line.startswith('#### '):
            pdf.chapter_title(line[5:], level=4)

        # Tablas simples
        elif '|' in line and line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_rows = []

            # Extraer celdas
            cells = [cell.strip() for cell in line.split('|')[1:-1]]
            if cells and not all(c.startswith('-') for c in cells):
                table_rows.append(cells)

        else:
            # Si salimos de una tabla, renderizarla
            if in_table:
                if len(table_rows) > 0:
                    pdf.add_table_row(table_rows[0], is_header=True)
                    for row in table_rows[1:]:
                        pdf.add_table_row(row)
                    pdf.ln()
                in_table = False
                table_rows = []

            # Texto normal
            if line.strip():
                # Limpiar markdown básico
                text = line.replace('**', '').replace('__', '')
                text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Links
                text = text.replace('`', '')

                # Solo agregar si no está vacío
                if text.strip() and not text.strip().startswith('---'):
                    pdf.chapter_body(text)

        i += 1

    # Guardar PDF
    pdf.output(pdf_file)
    print(f"✅ PDF generado: {pdf_file}")

if __name__ == "__main__":
    parse_markdown_to_pdf(
        'ANALISIS_PERFORMANCE_N8N_CL00.md',
        'ANALISIS_PERFORMANCE_N8N_CL00.pdf'
    )
