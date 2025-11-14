#!/usr/bin/env python3
"""
Script para convertir Markdown a HTML que luego puedes convertir a PDF
"""

import re

def md_to_html(md_file, html_file):
    """Convertir Markdown a HTML"""

    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Análisis de Performance - Flujo n8n CL00</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        h2 {
            color: #34495e;
            border-bottom: 2px solid #95a5a6;
            padding-bottom: 8px;
            margin-top: 25px;
        }
        h3 {
            color: #555;
            margin-top: 20px;
        }
        h4 {
            color: #666;
            margin-top: 15px;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        pre {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-left: 3px solid #3498db;
            padding: 15px;
            overflow-x: auto;
            border-radius: 4px;
        }
        pre code {
            background-color: transparent;
            padding: 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            font-size: 0.9em;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin-left: 0;
            color: #555;
            font-style: italic;
        }
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        li {
            margin: 5px 0;
        }
        strong {
            color: #2c3e50;
        }
        hr {
            border: none;
            border-top: 2px solid #ecf0f1;
            margin: 30px 0;
        }
        .emoji {
            font-size: 1.2em;
        }
        @media print {
            body {
                max-width: 100%;
            }
            h1 {
                page-break-before: always;
            }
            h1:first-child {
                page-break-before: avoid;
            }
        }
    </style>
</head>
<body>
"""

    # Procesar contenido
    lines = content.split('\n')
    in_code_block = False
    code_lang = ''
    code_buffer = []

    for line in lines:
        # Bloques de código
        if line.startswith('```'):
            if in_code_block:
                # Cerrar bloque
                html += f'<pre><code class="{code_lang}">'
                html += '\n'.join(code_buffer)
                html += '</code></pre>\n'
                code_buffer = []
                in_code_block = False
            else:
                # Abrir bloque
                code_lang = line[3:].strip()
                in_code_block = True
            continue

        if in_code_block:
            code_buffer.append(line.replace('<', '&lt;').replace('>', '&gt;'))
            continue

        # Títulos
        if line.startswith('# '):
            html += f'<h1>{line[2:]}</h1>\n'
        elif line.startswith('## '):
            html += f'<h2>{line[3:]}</h2>\n'
        elif line.startswith('### '):
            html += f'<h3>{line[4:]}</h3>\n'
        elif line.startswith('#### '):
            html += f'<h4>{line[5:]}</h4>\n'

        # Separadores
        elif line.strip() == '---':
            html += '<hr>\n'

        # Tablas
        elif line.strip().startswith('|') and '|' in line:
            cells = [cell.strip() for cell in line.split('|')[1:-1]]
            if cells and not all(c.startswith('-') for c in cells):
                # Detectar si es header (siguiente línea tiene guiones)
                html += '<tr>'
                for cell in cells:
                    # Aplicar formato básico
                    cell = cell.replace('**', '<strong>').replace('**', '</strong>')
                    cell = cell.replace('`', '<code>').replace('`', '</code>')
                    html += f'<td>{cell}</td>'
                html += '</tr>\n'

        # Listas
        elif line.strip().startswith('- ') or line.strip().startswith('* '):
            item = line.strip()[2:]
            item = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', item)
            item = re.sub(r'`([^`]+)`', r'<code>\1</code>', item)
            html += f'<li>{item}</li>\n'

        # Listas numeradas
        elif re.match(r'^\d+\. ', line.strip()):
            item = re.sub(r'^\d+\. ', '', line.strip())
            item = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', item)
            item = re.sub(r'`([^`]+)`', r'<code>\1</code>', item)
            html += f'<li>{item}</li>\n'

        # Párrafos
        elif line.strip():
            # Aplicar formato inline
            text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', line)
            text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
            text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', text)

            # Detección de tablas
            if '|' in text and not text.startswith('<'):
                if '<table>' not in html[-100:]:
                    html += '<table>\n'
                html += text
            else:
                html += f'<p>{text}</p>\n'
        else:
            # Línea vacía - cerrar lista si estaba abierta
            if '<li>' in html[-50:]:
                html += '</ul>\n'

    html += """
</body>
</html>
"""

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"✅ HTML generado: {html_file}")
    print(f"\nAhora puedes:")
    print(f"1. Abrir el archivo en tu navegador")
    print(f"2. Presionar Ctrl+P (Cmd+P en Mac)")
    print(f"3. Seleccionar 'Guardar como PDF'")
    print(f"\nO usa: wkhtmltopdf {html_file} output.pdf")

if __name__ == "__main__":
    md_to_html(
        'ANALISIS_PERFORMANCE_N8N_CL00.md',
        'ANALISIS_PERFORMANCE_N8N_CL00.html'
    )
