# -*- coding: utf-8 -*-
"""
Script generador del documento Word (.docx) y PDF del Plan de Negocios MinutaTech
Universidad del Tolima - Ingenieria de Sistemas
Formato ejecutivo, moderno, estructurado y sin normas APA rigidas, altamente legible y presentable.
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color_hex):
    """Aplica color de fondo a una celda de tabla"""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    """Aplica margenes/padding interno a una celda en dxa (1 pt = 20 dxa)"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="CCCCCC", sz="4", val="single"):
    """Aplica bordes limpios y modernos a una tabla"""
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:insideV w:val="none"/><w:left w:val="none"/><w:right w:val="none"/></w:tblBorders>')
    tblPr.append(borders)

def add_callout(doc, text_list, title="PUNTO CLAVE", border_color="0D9488", bg_color="F0FDFA"):
    """Crea una caja destacada (Callout Box) con borde lateral de color"""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_shading(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Borde izquierdo grueso, resto sin borde
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:color="{border_color}"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.bold = True
    run_t.font.name = "Calibri"
    run_t.font.size = Pt(10.5)
    run_t.font.color.rgb = RGBColor(13, 148, 136) # Teal
    
    for line in text_list:
        p2 = cell.add_paragraph()
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(3)
        p2.paragraph_format.line_spacing = 1.15
        run = p2.add_run(line)
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(30, 41, 59) # Slate 800
        
    doc.add_paragraph() # Espacio despues

def build_document():
    doc = docx.Document()
    
    # Configurar margenes de pagina (2.5 cm = 0.984 in)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
        # Header y Footer sutil
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("MinutaTech S.A.S. • Plan de Negocios de Base Tecnológica | Universidad del Tolima")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Facultad de Ingeniería de Sistemas — Quinto Semestre (2026)")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # Estilos Base
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 41, 59) # Slate 800
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Colores corporativos
    NAVY = RGBColor(30, 58, 138)   # #1E3A8A - Titulos principales
    TEAL = RGBColor(13, 148, 136)  # #0D9488 - Subtitulos
    DARK = RGBColor(15, 23, 42)    # #0F172A - Texto oscuro
    MUTED = RGBColor(100, 116, 139) # #64748B - Subtextos

    # ==========================================
    # PORTADA MODERNA
    # ==========================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(10)
    p_inst.paragraph_format.space_after = Pt(2)
    r = p_inst.add_run("UNIVERSIDAD DEL TOLIMA")
    r.bold = True
    r.font.size = Pt(15)
    r.font.color.rgb = NAVY
    
    p_fac = doc.add_paragraph()
    p_fac.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fac.paragraph_format.space_after = Pt(4)
    r = p_fac.add_run("FACULTAD DE INGENIERÍA DE SISTEMAS • ELECTIVA DE EMPRENDIMIENTO")
    r.bold = True
    r.font.size = Pt(10.5)
    r.font.color.rgb = TEAL

    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(14)
    r = p_line.add_run("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    r.font.color.rgb = RGBColor(203, 213, 225)

    p_doc = doc.add_paragraph()
    p_doc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_doc.paragraph_format.space_after = Pt(6)
    r = p_doc.add_run("PLAN DE NEGOCIOS PARA UNA EMPRESA DE BASE TECNOLÓGICA")
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = MUTED

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(8)
    r = p_title.add_run("MINUTATECH\nPlataforma Integral de Gestión, Seguridad y Control para Copropiedades Residenciales")
    r.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = NAVY

    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_desc.paragraph_format.space_after = Pt(16)
    r = p_desc.add_run("Propuesta de estructuración, viabilidad técnico-económica y comercial de una solución SaaS para el sector de Propiedad Horizontal en Colombia")
    r.italic = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = MUTED

    # Bloque de integrantes con roles
    p_team_h = doc.add_paragraph()
    p_team_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_team_h.paragraph_format.space_after = Pt(6)
    r = p_team_h.add_run("EQUIPO EMPRENDEDOR & ROLES")
    r.bold = True
    r.font.size = Pt(10.5)
    r.font.color.rgb = NAVY

    team_members = [
        ("Sebastián Sandoval", "Líder de Proyecto / Arquitectura de Software & Fullstack"),
        ("Darwin Quintero", "Especialista en Backend, Seguridad y Bases de Datos"),
        ("Andrés Cipamocha", "Especialista en Frontend, UI/UX y Vistas de Garita"),
        ("Diego Lavacude", "Líder de Calidad de Software, Pruebas Automatizadas (QA) y Ciberseguridad"),
        ("Juan Molina", "Coordinador de Operaciones, Gestión Comercial y Soporte al Cliente")
    ]

    t_team = doc.add_table(rows=len(team_members)+1, cols=2)
    t_team.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_team.autofit = False
    
    # Header tabla integrantes
    t_team.cell(0, 0).text = "Estudiante / Emprendedor"
    t_team.cell(0, 1).text = "Rol y Área de Responsabilidad"
    t_team.cell(0, 0).width = Inches(2.7)
    t_team.cell(0, 1).width = Inches(3.8)
    set_cell_shading(t_team.cell(0, 0), "1E3A8A")
    set_cell_shading(t_team.cell(0, 1), "1E3A8A")
    for cell in (t_team.cell(0, 0), t_team.cell(0, 1)):
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
        p.runs[0].font.size = Pt(9)
        set_cell_margins(cell, top=60, bottom=60, left=120, right=120)

    for idx, (name, role) in enumerate(team_members, start=1):
        c1 = t_team.cell(idx, 0)
        c2 = t_team.cell(idx, 1)
        c1.text = name
        c2.text = role
        c1.paragraphs[0].runs[0].font.bold = True
        c1.paragraphs[0].runs[0].font.size = Pt(8.5)
        c2.paragraphs[0].runs[0].font.size = Pt(8.5)
        bg = "F8FAFC" if idx % 2 == 0 else "FFFFFF"
        set_cell_shading(c1, bg)
        set_cell_shading(c2, bg)
        set_cell_margins(c1, top=50, bottom=50, left=120, right=120)
        set_cell_margins(c2, top=50, bottom=50, left=120, right=120)
    set_table_borders(t_team, color="E2E8F0")

    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot.paragraph_format.space_before = Pt(14)
    p_foot.paragraph_format.space_after = Pt(0)
    r = p_foot.add_run("Ibagué, Tolima • Colombia — 2026")
    r.font.size = Pt(9)
    r.font.color.rgb = MUTED

    doc.add_page_break()

    # ==========================================
    # TABLA DE CONTENIDO EJECUTIVA
    # ==========================================
    p_toc_t = doc.add_paragraph()
    p_toc_t.paragraph_format.space_before = Pt(10)
    p_toc_t.paragraph_format.space_after = Pt(8)
    r = p_toc_t.add_run("TABLA DE CONTENIDO GENERAL")
    r.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = NAVY

    toc_items = [
        ("1. Resumen Ejecutivo", "1.1 Descripción • 1.2 Problema • 1.3 Solución • 1.4 Mercado • 1.5 Ingresos • 1.6 Inversión"),
        ("2. Presentación de la Idea de Negocio", "2.1 Empresa • 2.2 Antecedentes • 2.3 Objetivo General • 2.4 Específicos • 2.5 Justificación"),
        ("3. Identificación del Problema y Oportunidad", "3.1 Contexto • 3.2 Causas/Efectos • 3.3 Necesidades • 3.4 Evidencias • 3.5 Oportunidad"),
        ("4. Descripción de la Solución Tecnológica", "4.1 Producto • 4.2 Funcionalidades • 4.3 Beneficios • 4.4 Valor • 4.5 Innovación • 4.6 Madurez"),
        ("5. Análisis del Mercado", "5.1 Sector • 5.2 Segmentación • 5.3 Perfil Cliente • 5.4 TAM/SAM/SOM • 5.5 Competencia"),
        ("6. Modelo de Negocio", "6.1 Clientes • 6.2 Propuesta Valor • 6.3 Canales • 6.4 Relación • 6.5 Ingresos • 6.8 Canvas"),
        ("7. Estudio Técnico y Tecnológico", "7.1 Requerimientos • 7.2 Arquitectura • 7.3 Stack React/Node/Redis • 7.5 Seguridad • 7.6 Scrum"),
        ("8. Estudio Organizacional", "8.1 Misión/Visión • 8.2 Estructura y Organigrama • 8.3 Roles y Responsabilidades del Equipo"),
        ("9. Aspectos Legales y Propiedad Intelectual", "9.1 S.A.S. • 9.2 Ley 675 / Ley 1755 / Ley 1581 • 9.3 Registro DNDA / Marca SIC"),
        ("10. Estrategia de Marketing y Ventas", "10.1 Objetivos • 10.2 Marketing Mix 4Ps • 10.3 Embudo de Venta • 10.4 Métricas CAC/LTV"),
        ("11. Estudio Financiero", "11.1 Inversión $14.5M • 11.3 Costos Fijos/Variables • 11.6 PyG 3 Años • 11.9 VPN/TIR 38.4%"),
        ("12. Gestión de Riesgos", "12.1 Matriz de Riesgos (Comercial, Operativo, Ciberseguridad, Legal) y Plan de Contingencia"),
        ("13. Sostenibilidad e Impacto", "13.1 Impacto Económico • 13.2 Impacto Social • 13.3 Impacto Ambiental (Cero Papel) • ODS"),
        ("14. Plan de Implementación", "14.1 Fases del Proyecto • 14.2 Cronograma Mensual • 14.3 Hitos y Entregables Clave"),
        ("15. Conclusiones y Recomendaciones", "15.1 Conclusiones (Mapeo 1 a 1 a Objetivos Específicos) • 15.2 Recomendaciones"),
        ("Referencias Bibliográficas & Anexos", "Fuentes APA 7ma Edición • Anexo A Canvas • Anexo B Encuesta • Anexo C Tests Vitest")
    ]

    t_toc = doc.add_table(rows=len(toc_items)+1, cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_toc.autofit = False
    t_toc.cell(0, 0).text = "Capítulo / Sección"
    t_toc.cell(0, 1).text = "Subtemas y Alcance"
    t_toc.cell(0, 0).width = Inches(2.6)
    t_toc.cell(0, 1).width = Inches(3.9)
    set_cell_shading(t_toc.cell(0, 0), "1E3A8A")
    set_cell_shading(t_toc.cell(0, 1), "1E3A8A")
    for cell in (t_toc.cell(0, 0), t_toc.cell(0, 1)):
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
        p.runs[0].font.size = Pt(8.5)
        set_cell_margins(cell, top=50, bottom=50, left=100, right=100)

    for idx, (cap, sub) in enumerate(toc_items, start=1):
        c1 = t_toc.cell(idx, 0)
        c2 = t_toc.cell(idx, 1)
        c1.text = cap
        c2.text = sub
        c1.paragraphs[0].runs[0].font.bold = True
        c1.paragraphs[0].runs[0].font.size = Pt(8)
        c2.paragraphs[0].runs[0].font.size = Pt(7.5)
        c2.paragraphs[0].runs[0].font.color.rgb = MUTED
        bg = "F8FAFC" if idx % 2 == 0 else "FFFFFF"
        set_cell_shading(c1, bg)
        set_cell_shading(c2, bg)
        set_cell_margins(c1, top=35, bottom=35, left=100, right=100)
        set_cell_margins(c2, top=35, bottom=35, left=100, right=100)
    set_table_borders(t_toc, color="E2E8F0")

    doc.add_page_break()

    # ==========================================
    # FUNCIONES HELPER PARA CONTENIDO
    # ==========================================
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.color.rgb = NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = TEAL
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = DARK
        return p

    def add_p(text, bold_prefix=None, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix + " ")
            r_pre.bold = True
            r_pre.font.color.rgb = DARK
        r = p.add_run(text)
        r.italic = italic
        r.font.size = Pt(10)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            # Quitamos cualquier bullet duplicado en el prefix
            clean_prefix = bold_prefix.replace("•", "").strip()
            r_pre = p.add_run(clean_prefix + " ")
            r_pre.bold = True
            r_pre.font.color.rgb = DARK
        r = p.add_run(text)
        r.font.size = Pt(10)
        return p

    def add_styled_table(headers, data, col_widths=None):
        tbl = doc.add_table(rows=len(data)+1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        # Headers
        for i, h in enumerate(headers):
            cell = tbl.cell(0, i)
            cell.text = h
            set_cell_shading(cell, "1E3A8A")
            if col_widths and i < len(col_widths):
                cell.width = col_widths[i]
            p = cell.paragraphs[0]
            if len(p.runs) > 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                p.runs[0].font.size = Pt(9.5)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)

        # Rows
        for r_idx, row in enumerate(data, start=1):
            bg = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
            for c_idx, val in enumerate(row):
                cell = tbl.cell(r_idx, c_idx)
                cell.text = str(val)
                set_cell_shading(cell, bg)
                if col_widths and c_idx < len(col_widths):
                    cell.width = col_widths[c_idx]
                p = cell.paragraphs[0]
                if len(p.runs) > 0:
                    p.runs[0].font.size = Pt(9.5)
                set_cell_margins(cell, top=80, bottom=80, left=140, right=140)

        set_table_borders(tbl, color="E2E8F0")
        doc.add_paragraph() # Espacio
        return tbl

    # ==========================================
    # CAPÍTULO 1: RESUMEN EJECUTIVO
    # ==========================================
    add_h1("1. Resumen Ejecutivo")
    
    add_h2("1.1 Descripción General de la Iniciativa")
    add_p("MinutaTech es una iniciativa de base tecnológica desarrollada por estudiantes de quinto semestre de Ingeniería de Sistemas de la Universidad del Tolima. El proyecto consiste en una plataforma de software en la nube bajo el modelo SaaS (Software as a Service) orientada a la gestión operativa, control de seguridad en portería, administración financiera y comunicación comunitaria en conjuntos cerrados y edificios residenciales regidos por el régimen de propiedad horizontal en Colombia.")

    add_h2("1.2 Problema u Oportunidad Identificada")
    add_p("La gran mayoría de copropiedades en Colombia gestionan su seguridad y administración mediante registros manuales en cuadernos de papel (minuta física, planillas de visitantes y recibos de paquetería). Esto genera pérdida constante de encomiendas, tiempos excesivos en el registro peatonal y vehicular, demoras de semanas en responder quejas (incumpliendo el término de 15 días hábiles fijado por la Ley 1755 de 2015), asambleas desorganizadas sin control de quórum exacto por coeficientes y falta de trazabilidad ante eventos de seguridad.")

    add_h2("1.3 Solución Tecnológica Propuesta")
    add_p("MinutaTech digitaliza por completo la operación residencial mediante una aplicación web progresiva y modular que incluye:")
    add_bullet("Minuta digital con registro inmutable de eventos.", "• Bitácora Operativa:")
    add_bullet("Generación de código PIN seguro para el retiro de pedidos y correspondencia.", "• Paquetería con PIN:")
    add_bullet("Cálculo automático de quórum y votaciones ponderadas por coeficiente en tiempo real (Ley 675 de 2001).", "• Asambleas Digitales:")
    add_bullet("Control estricto de plazos legales de 15 días hábiles con alertas y respuestas oficiales.", "• Módulo de PQRS:")
    add_bullet("Asistente conversacional con procesamiento de lenguaje natural y detección de emergencias.", "• MinutaBot IA:")
    add_bullet("Emisión digital de certificados con código QR de verificación antifraude.", "• Paz y Salvo Oficial:")

    add_h2("1.4 Mercado Objetivo")
    add_p("El mercado objetivo primario está conformado por empresas de vigilancia y seguridad privada, administraciones de conjuntos residenciales y edificios de estratos 3, 4, 5 y 6 ubicados en Ibagué, el Eje Cafetero y la región central de Colombia.")

    add_h2("1.5 Modelo de Ingresos")
    add_p("El modelo de negocio se basa en una suscripción mensual recurrente (MRR) por conjunto residencial:")
    add_bullet("$160.000 COP / mes.", "• Plan Básico (hasta 80 unidades):")
    add_bullet("$280.000 COP / mes.", "• Plan Estándar (81 a 200 unidades):")
    add_bullet("$420.000 COP / mes.", "• Plan Empresarial (más de 200 unidades o multitorre):")

    add_h2("1.6 Inversión Requerida y Resultados Esperados")
    add_p("Para la puesta en marcha se requiere una inversión inicial de $14.500.000 COP, destinada a infraestructura en la nube, formalización jurídica, desarrollo final de módulos y comercialización inicial. Las proyecciones financieras demuestran que el punto de equilibrio se alcanza en el mes 8 de operación, con un Valor Presente Neto (VPN) de $74.850.000 COP y una Tasa Interna de Retorno (TIR) proyectada del 38.4% a tres años.")

    add_callout(doc, [
        "Inversión Inicial: $14.500.000 COP",
        "Punto de Equilibrio: 9 conjuntos residenciales activos (Mes 8)",
        "Tasa Interna de Retorno (TIR): 38.4% a 3 años",
        "Valor Presente Neto (VPN): $74.850.000 COP"
    ], title="MÉTRICAS CLAVE DEL PROYECTO")

    # ==========================================
    # CAPÍTULO 2: PRESENTACIÓN DE LA IDEA
    # ==========================================
    add_h1("2. Presentación de la Idea de Negocio")
    
    add_h2("2.1 Nombre y Descripción de la Empresa")
    add_p("MinutaTech S.A.S. es una empresa de base tecnológica constituida para ofrecer soluciones de transformación digital en la administración de inmuebles y seguridad privada. El producto insignia es la Plataforma Residencial MinutaTech (EcoBosque P.H.).")
    add_bullet("6201 (Actividades de desarrollo de sistemas informáticos)", "• Código CIIU Principal:")
    add_bullet("6311 (Procesamiento de datos y alojamiento web)", "• Código CIIU Secundario:")

    add_h2("2.2 Antecedentes y Origen de la Idea")
    add_p("El proyecto nació de la necesidad observada en el sector hotelero y residencial de Ibagué. Tras analizar cómo los hoteles gestionan habitaciones y consumos, el equipo descubrió que la propiedad horizontal sufría exactamente el mismo desorden operativo en garitas y administraciones, pero con un vacío enorme de herramientas accesibles para conjuntos medianos y pequeños.")

    add_h2("2.3 Objetivo General")
    add_p("Desarrollar y comercializar una plataforma web modular bajo el modelo Software as a Service (SaaS) que permita automatizar la gestión de portería, control de accesos, asambleas de copropietarios y radicación de solicitudes en conjuntos residenciales de Colombia durante el periodo 2026-2028.")

    add_h2("2.4 Objetivos Específicos")
    add_bullet("Implementar un módulo de minuta digital y paquetería segura con autenticación mediante código PIN para erradicar el uso de papel en porterías.", "1. Minuta y Paquetería:")
    add_bullet("Integrar un motor de votaciones en tiempo real para asambleas que calcule automáticamente el quórum y los resultados ponderados por coeficientes de copropiedad según la Ley 675 de 2001.", "2. Asambleas y Quórum:")
    add_bullet("Desarrollar un módulo de radicación y seguimiento de PQRS que calcule automáticamente los 15 días hábiles de respuesta fijados por la Ley 1755 de 2015.", "3. PQRS y Plazos Legales:")
    add_bullet("Validar el modelo de negocio mediante pruebas piloto en al menos 5 conjuntos residenciales en el departamento del Tolima.", "4. Validación y Pilotos:")

    add_h2("2.5 Justificación")
    add_p("En Colombia, la Ley 675 de 2001 exige a los administradores llevar una contabilidad fidedigna, libros de actas y registros claros de correspondencia. MinutaTech aporta una solución eficiente, económica y con respaldo normativo que moderniza la labor del personal de vigilancia, ahorra miles de hojas de papel al año y mejora la convivencia comunitaria.")

    add_h2("2.6 Alcance y Limitaciones")
    add_bullet("Aplicación web accesible desde cualquier navegador en computadores, tabletas y celulares. Cubre garita, administración y portal de residentes.", "• Alcance:")
    add_bullet("Requiere conexión a Internet básica. No incluye hardware biométrico propio, funcionando sobre las tablets o PCs existentes del conjunto.", "• Limitaciones:")

    # ==========================================
    # CAPÍTULO 3: PROBLEMA Y OPORTUNIDAD
    # ==========================================
    add_h1("3. Identificación del Problema y la Oportunidad")

    add_h2("3.1 Contexto y Situación Problemática")
    add_p("En Colombia existen más de 65.000 conjuntos residenciales y edificios bajo propiedad horizontal. El punto crítico de la operación diaria se concentra en la garita o portería, donde los guardas de seguridad atienden simultáneamente la correspondencia, el ingreso de visitantes, las quejas de vecinos y los libros de control. Esta sobrecarga operativa genera fallas de seguridad, pérdidas de encomiendas y desinformación.")

    add_h2("3.2 Causas y Consecuencias")
    headers_3 = ["Causa Directa", "Consecuencia Operativa", "Impacto Legal y Económico"]
    data_3 = [
        ["Registro en minutas de papel", "Pérdida de apuntes y dificultad para auditar eventos", "Falta de evidencia ante incidentes o hurtos"],
        ["Entrega informal de paquetes", "Entregas erróneas a apartamentos equivocados", "Reclamaciones económicas y disputas"],
        ["Conteo manual en asambleas", "Demoras de 4 a 6 horas y errores de cálculo", "Impugnación de asambleas y actas"],
        ["Gestión informal de quejas", "Vencimiento de términos de 15 días hábiles", "Acciones de tutela y sanciones a la administración"]
    ]
    add_styled_table(headers_3, data_3, [Inches(2.0), Inches(2.3), Inches(2.2)])

    add_h2("3.3 Necesidades del Usuario o Cliente")
    add_bullet("Registrar ingresos y encomiendas en menos de 20 segundos sin llenar planillas manuales.", "• Guarda de Seguridad:")
    add_bullet("Supervisar los turnos de los guardas en tiempo real, responder requerimientos a tiempo y emitir paz y salvos oficiales.", "• Administrador del Conjunto:")
    add_bullet("Recibir alertas instantáneas cuando llega un paquete y poder votar en asambleas desde su celular.", "• Copropietario / Residente:")

    add_h2("3.4 Evidencias y Validación Inicial")
    add_p("Se realizaron 30 encuestas a residentes y administradores en conjuntos de Ibagué (Tolima). El 86.6% de los encuestados reportó haber tenido inconvenientes con la entrega de paquetes o demoras en la atención de quejas por parte de la administración, y el 93.3% manifestó interés en una solución digital accesible desde el celular.")

    add_h2("3.5 Formulación de la Oportunidad de Negocio")
    add_p("Existe una demanda creciente de digitalización en el sector inmobiliario y de propiedad horizontal (*Proptech*). La oportunidad consiste en ofrecer una solución integral a un costo accesible para administraciones medianas y pequeñas que no pueden pagar plataformas corporativas de alto costo.")

    # ==========================================
    # CAPÍTULO 4: DESCRIPCIÓN DE LA SOLUCIÓN
    # ==========================================
    add_h1("4. Descripción de la Solución Tecnológica")

    add_h2("4.1 Producto o Servicio Tecnológico")
    add_p("MinutaTech es una plataforma web progresiva (PWA) desarrollada sobre tecnologías modernas que conecta a la administración, el personal de portería y los residentes en un único entorno colaborativo.")

    add_h2("4.2 Características y Funcionalidades")
    add_bullet("Registro cronológico de novedades con clasificación por severidad (Informativa, Advertencia, Peligro) y número de radicado único.", "1. Minuta Digital de Vigilancia:")
    add_bullet("Registro de paquetes y recibos públicos que genera un código PIN aleatorio de 4 dígitos hasheado con Bcrypt. La entrega solo se valida cuando el residente presenta el PIN correcto.", "2. Paquetería con PIN Seguro:")
    add_bullet("Registro de asistencia, cálculo de quórum en vivo y votaciones ponderadas por el coeficiente de copropiedad de cada inmueble.", "3. Asambleas y Votaciones Digitales (Ley 675):")
    add_bullet("Formulario para peticiones, quejas y mantenimientos con cálculo exacto de 15 días hábiles de respuesta y respuestas formales.", "4. Módulo de PQRS (Ley 1755):")
    add_bullet("Asistente conversacional con procesamiento de lenguaje natural que responde preguntas sobre el reglamento del conjunto y activa alertas de emergencia SOS.", "5. Asistente MinutaBot IA:")
    add_bullet("Emisión digital de paz y salvos en PDF con membrete y código QR antifraude para verificar autenticidad.", "6. Certificados y Paz y Salvo con QR:")
    add_bullet("Registro de vacunas de mascotas y calendario de reservas para canchas sintéticas, zonas BBQ y salones sociales.", "7. Mascotas y Zonas Comunes:")

    add_h2("4.3 Beneficios para el Cliente")
    add_bullet("Reducción del 70% en el tiempo dedicado al registro de visitas y paquetería.", "• Ahorro de Tiempo:")
    add_bullet("Registro digital inalterable que previene fraudes y disputas entre copropietarios.", "• Transparencia Total:")
    add_bullet("Eliminación completa de cuadernos de minuta, planillas y circulares impresas.", "• Cero Papel:")

    add_h2("4.4 Propuesta de Valor")
    add_p("Ofrecer a las copropiedades una herramienta integral, rápida e intuitiva que profesionaliza la seguridad y la administración con estricto apego a las leyes colombianas, a un costo accesible para cualquier presupuesto de administración.")

    add_h2("4.5 Elementos Innovadores y Diferenciadores")
    add_p("A diferencia de los citófonos tradicionales o aplicaciones aisladas de citofonía, MinutaTech integra en una sola herramienta la seguridad física (rondas QR, extintores), la gestión legal (asambleas, PQRS) y la inteligencia artificial local para emergencias.")

    add_h2("4.6 Estado de Madurez")
    add_p("El proyecto se encuentra en estado de **Producto Mínimo Viable (MVP) completamente funcional**, probado con una suite de 60 pruebas unitarias y desplegado en servidores de producción en la nube.")

    # ==========================================
    # CAPÍTULO 5: ANÁLISIS DE MERCADO
    # ==========================================
    add_h1("5. Análisis del Mercado")

    add_h2("5.1 Caracterización del Sector")
    add_p("El proyecto se enmarca en la industria del software (*Proptech* y tecnologías de la información) y el sector de servicios a la propiedad raíz y seguridad privada en Colombia. Es un sector en constante expansión debido al incremento en la construcción de vivienda vertical y conjuntos cerrados en ciudades intermedias y capitales.")

    add_h2("5.2 Segmentación del Mercado")
    add_bullet("Inicialmente Ibagué y municipios aledaños (Girardot, Espinal, Melgar); posteriormente expansión a Bogotá y Eje Cafetero.", "• Criterio Geográfico:")
    add_bullet("Conjuntos residenciales de estratos 3, 4, 5 y 6 con más de 40 unidades habitacionales.", "• Criterio Demográfico:")
    add_bullet("Administraciones y empresas de seguridad que buscan optimizar costos operativos y mejorar la satisfacción del copropietario.", "• Criterio Conductual:")

    add_h2("5.3 Perfil del Cliente o Usuario")
    add_bullet("Consejo de Administración o Administrador de Propiedad Horizontal con facultad de contratación.", "• Cliente Comprador:")
    add_bullet("Guarda de seguridad de portería (edad promedio 25-50 años, requiere interfaz visual simple y botones grandes).", "• Usuario Operativo:")
    add_bullet("Residente o propietario que accede desde su smartphone.", "• Usuario Final:")

    add_h2("5.4 Tamaño del Mercado (TAM, SAM y SOM)")
    headers_5 = ["Nivel de Mercado", "Definición", "Cifra Estimada", "Sustento Metodológico"]
    data_5 = [
        ["TAM (Total)", "Universo de copropiedades en Colombia", "65.000 copropiedades", "Censos DANE, Fedelonjas y Camacol nacional"],
        ["SAM (Servible)", "Mercado regional accesible (Tolima y Eje Cafetero)", "3.800 conjuntos", "1.200 en Ibagué + corredor Girardot/Melgar/Eje Cafetero"],
        ["SOM (Objetivo)", "Meta comercial alcanzable en 18 meses", "45 conjuntos", "Capacidad operativa del equipo (1.18% del SAM regional)"]
    ]
    add_styled_table(headers_5, data_5, [Inches(1.5), Inches(2.0), Inches(1.3), Inches(1.7)])

    add_h2("5.5 Tendencias y Oportunidades del Mercado")
    add_bullet("Mayor exigencia de cumplimiento normativo en protección de datos personales (Habeas Data).", "• Protección de Datos:")
    add_bullet("Crecimiento del comercio electrónico y recepción masiva de paquetería en portería.", "• Auge E-commerce:")
    add_bullet("Adopción de asambleas virtuales o híbridas tras la modernización de los reglamentos internos.", "• Asambleas Híbridas:")

    add_h2("5.6 Análisis de Competidores")
    headers_comp = ["Competidor", "Puntos Fuertes", "Debilidades", "Diferencial de MinutaTech"]
    data_comp = [
        ["Citofonía Virtual Tradicional", "Muy conocida en el mercado", "Solo hace llamadas, no maneja asambleas ni minutas", "Suite completa todo en uno"],
        ["Plataformas Contables (Siigo, etc.)", "Fuertes en contabilidad general", "Complejas para el guarda de portería y costosas", "Interfaz sencilla pensada para garita"],
        ["Cuadernos de Minuta Física", "Costo inmediato bajo", "Pérdida de datos, nula seguridad y cero trazabilidad", "Seguridad con PIN, respaldo en nube y rapidez"]
    ]
    add_styled_table(headers_comp, data_comp, [Inches(1.6), Inches(1.6), Inches(1.7), Inches(1.6)])

    add_h2("5.7 Resultados de Validaciones")
    add_p("En las entrevistas realizadas a guardas de portería, el 100% coincidió en que la entrega de paquetes es la tarea que más interrupciones y reclamos les genera, valorando positivamente el uso de un código PIN para deslindar su responsabilidad.")

    # ==========================================
    # CAPÍTULO 6: MODELO DE NEGOCIO
    # ==========================================
    add_h1("6. Modelo de Negocio")

    add_h2("6.1 Segmentos de Clientes")
    add_p("Conjuntos cerrados y edificios residenciales de estratos 3 a 6, empresas de seguridad privada y edificios de oficinas comerciales.")

    add_h2("6.2 Propuesta de Valor")
    add_p("Digitalización integral de la portería y la administración residencial mediante una plataforma web confiable, ágil y ajustada a las leyes colombianas.")

    add_h2("6.3 Canales de Comunicación, Distribución y Venta")
    add_p("Venta directa presencial con demostraciones a consejos de administración, alianzas con empresas de seguridad privada y marketing digital segmentado.")

    add_h2("6.4 Relación con los Clientes")
    add_p("Capacitación presencial durante la primera semana, soporte continuo vía WhatsApp y acompañamiento remoto durante las asambleas generales ordinarias.")

    add_h2("6.5 Fuentes de Ingresos")
    add_bullet("Cobro mensual por conjunto según número de apartamentos ($160k a $420k COP).", "1. Suscripción SaaS Recurrente:")
    add_bullet("Tarifa única de $120.000 COP por cargue de censo y configuración inicial.", "2. Parametrización Inicial:")
    add_bullet("Acompañamiento y soporte técnico durante asamblea ordinaria ($150.000 COP).", "3. Soporte en Asambleas:")

    add_h2("6.6 Recursos y Actividades Clave")
    add_bullet("Código fuente, infraestructura cloud, equipo de ingenieros de desarrollo y soporte.", "• Recursos Clave:")
    add_bullet("Desarrollo continuo de software, capacitación a guardas, soporte técnico y prospección comercial.", "• Actividades Clave:")

    add_h2("6.7 Socios y Estructura de Costos")
    add_bullet("Empresas de vigilancia privada, asociaciones de administradores de P.H. y proveedores cloud.", "• Socios Clave:")
    add_bullet("Servidores cloud, salarios de desarrollo y soporte, formalización jurídica e impuestos.", "• Estructura de Costos:")

    add_h2("6.8 Lienzo Canvas Sintético")
    add_callout(doc, [
        "Propuesta de Valor: Suite integral todo en uno para portería y administración ajustada a Ley 675 y 1755.",
        "Segmentos: Conjuntos residenciales estratos 3-6 y empresas de seguridad privada.",
        "Canales: Venta directa a administradores y alianzas con empresas de vigilancia.",
        "Fuentes de Ingresos: Planes mensuales de $160.000, $280.000 y $420.000 COP.",
        "Estructura de Costos: Servidores cloud, nómina técnica y gastos comerciales."
    ], title="RESUMEN LIENZO BUSINESS MODEL CANVAS")

    # ==========================================
    # CAPÍTULO 7: ESTUDIO TÉCNICO Y TECNOLÓGICO
    # ==========================================
    add_h1("7. Estudio Técnico y Tecnológico")

    add_h2("7.1 Requerimientos Funcionales y No Funcionales")
    headers_req = ["Código", "Tipo", "Descripción del Requerimiento"]
    data_req = [
        ["RF01", "Funcional", "Autenticación segura con control de acceso basado en roles (Admin, Guarda, Residente)."],
        ["RF02", "Funcional", "Generación y verificación de PIN hasheado con Bcrypt para entrega de paquetes."],
        ["RF03", "Funcional", "Cálculo de quórum y votaciones ponderadas por coeficiente en asambleas (Ley 675)."],
        ["RF04", "Funcional", "Radicación de PQRS con cómputo automático de 15 días hábiles de respuesta (Ley 1755)."],
        ["RNF01", "No Funcional", "Tiempo de respuesta promedio inferior a 500 milisegundos en todas las vistas."],
        ["RNF02", "No Funcional", "Diseño web adaptable (responsive) optimizado para tablets de garita y celulares."],
        ["RNF03", "No Funcional", "Seguridad con JWT, cabeceras Helmet, rate limiting anti-fuerza bruta y cifrado."]
    ]
    add_styled_table(headers_req, data_req, [Inches(1.2), Inches(1.5), Inches(3.8)])

    add_h2("7.2 Arquitectura de la Solución")
    add_p("El sistema utiliza una arquitectura desacoplada basada en el patrón cliente-servidor:")
    add_bullet("Aplicación de una sola página (SPA) construida en React 19 y empaquetada con Vite.", "• Frontend (Cliente):")
    add_bullet("API REST estructurada sobre Node.js y Express 5 con controladores modulares.", "• Backend (Servidor API):")
    add_bullet("Almacenamiento híbrido con base de datos Redis en la nube y persistencia en archivos JSON protegidos en disco para tolerancia a fallos.", "• Capa de Persistencia:")

    add_h2("7.3 Tecnologías, Plataformas y Herramientas")
    add_bullet("JavaScript (ES6+), HTML5, CSS3.", "• Lenguajes:")
    add_bullet("TailwindCSS (estilos), Framer Motion (transiciones), jsPDF (generación de documentos PDF), Lucide Icons.", "• Librerías Frontend:")
    add_bullet("JWT (autenticación), Bcryptjs (hasheo seguro), Helmet (cabeceras de seguridad), Pino (registro de eventos y logs).", "• Librerías Backend:")
    add_bullet("Git, GitHub, Vitest, Supertest.", "• Control de Versiones y Pruebas:")

    add_h2("7.4 Infraestructura y Servicios en la Nube")
    add_bullet("Vercel / Railway para despliegue automatizado continuo (CI/CD).", "• Alojamiento Web:")
    add_bullet("Upstash Redis Serverless para acceso a datos en memoria de baja latencia.", "• Base de Datos:")

    add_h2("7.5 Seguridad de la Información")
    add_bullet("Cifrado unidireccional de contraseñas y códigos PIN con Bcrypt (10 rondas de salt).", "• Hasheo de PINs:")
    add_bullet("Control de tasa de peticiones (*Rate Limiting*) para mitigar ataques de fuerza bruta.", "• Anti Fuerza Bruta:")
    add_bullet("Cumplimiento de la Ley 1581 de 2012 mediante almacenamiento protegido de datos de residentes.", "• Protección de Datos:")

    add_h2("7.6 Metodología de Desarrollo y Pruebas")
    add_p("Se aplicó la metodología ágil **Scrum** en iteraciones de 2 semanas. El software fue validado mediante una suite de **60 pruebas unitarias automatizadas en Vitest** con 100% de éxito en autenticación, paquetería, asambleas y PQRS.")

    # ==========================================
    # CAPÍTULO 8: ESTUDIO ORGANIZACIONAL
    # ==========================================
    add_h1("8. Estudio Organizacional")

    add_h2("8.1 Misión, Visión y Valores")
    add_bullet("Transformar la gestión de las copropiedades mediante soluciones tecnológicas accesibles y seguras que mejoren la convivencia, optimicen el trabajo de los guardas y faciliten la labor administrativa.", "• Misión:")
    add_bullet("Para el año 2029, ser la plataforma líder de gestión de propiedad horizontal en la región central de Colombia, reconocida por su simplicidad, confiabilidad y soporte cercano.", "• Visión:")
    add_bullet("Transparencia, innovación práctica, seguridad de la información, respeto y trabajo en equipo.", "• Valores:")

    add_h2("8.2 Estructura Organizacional y Roles del Equipo")
    add_p("El equipo fundador está conformado por los 5 estudiantes de Ingeniería de Sistemas con roles claramente asignados:")

    headers_roles = ["Estudiante", "Cargo / Rol", "Funciones Principales"]
    data_roles = [
        ["Sebastián Sandoval", "Líder de Proyecto / Tech Lead", "Dirección general, arquitectura de software, integración fullstack y coordinación del equipo."],
        ["Darwin Quintero", "Especialista en Backend & Seguridad", "Desarrollo de API REST, controladores de datos, persistencia en Redis y seguridad criptográfica."],
        ["Andrés Cipamocha", "Especialista en Frontend & UI/UX", "Diseño de interfaces en React/Tailwind, vistas de garita táctil y portal de residentes."],
        ["Diego Lavacude", "Líder de QA & Ciberseguridad", "Diseño de pruebas automatizadas con Vitest, pruebas de estrés y auditoría de vulnerabilidades."],
        ["Juan Molina", "Coordinador de Operaciones & Ventas", "Contacto con administradores, gestión comercial, capacitación a guardas y soporte al cliente."]
    ]
    add_styled_table(headers_roles, data_roles, [Inches(1.6), Inches(2.0), Inches(2.9)])

    add_h2("8.3 Alianzas Estratégicas")
    add_p("Alianzas con empresas de vigilancia registradas ante la Superintendencia de Vigilancia y Seguridad Privada para ofrecer la herramienta dentro de su oferta de valor en licitaciones de conjuntos cerrados.")

    # ==========================================
    # CAPÍTULO 9: ASPECTOS LEGALES
    # ==========================================
    add_h1("9. Aspectos Legales y de Propiedad Intelectual")

    add_h2("9.1 Forma Jurídica y Formalización")
    add_p("Se constituirá como **Sociedad por Acciones Simplificada (S.A.S.)** denominada *MinutaTech S.A.S.* ante la Cámara de Comercio de Ibagué, con matrícula mercantil y NIT ante la DIAN.")

    add_h2("9.2 Marco Normativo Aplicable en Colombia")
    add_bullet("Define la administración de bienes comunes, libro de actas, coeficientes y quórum en asambleas.", "• Ley 675 de 2001 (Propiedad Horizontal):")
    add_bullet("Fija el término perentorio de 15 días hábiles para resolver peticiones y reclamos.", "• Ley 1755 de 2015 (Derecho de Petición / PQRS):")
    add_bullet("Regula la custodia y tratamiento de datos personales de visitantes y residentes.", "• Ley 1581 de 2012 (Habeas Data):")

    add_h2("9.3 Propiedad Intelectual")
    add_p("Registro del soporte lógico (software) ante la **Dirección Nacional de Derecho de Autor (DNDA)** y registro de marca ante la Superintendencia de Industria y Comercio (SIC) en la Clase 42 de Niza.")

    # ==========================================
    # CAPÍTULO 10: ESTRATEGIA DE MARKETING
    # ==========================================
    add_h1("10. Estrategia de Marketing y Ventas")

    add_h2("10.1 Objetivos Comerciales")
    add_bullet("Vincular 10 conjuntos residenciales en los primeros 6 meses de operación en Ibagué.", "• Corto Plazo:")
    add_bullet("Alcanzar 35 conjuntos residenciales activos al finalizar el primer año.", "• Mediano Plazo:")
    add_bullet("Mantener una tasa de retención superior al 95%.", "• Retención:")

    add_h2("10.2 Marketing Mix (4Ps)")
    add_bullet("Suite SaaS en la nube para portería, asambleas y residentes.", "• Producto:")
    add_bullet("Desde $160.000 COP mensuales por conjunto.", "• Precio:")
    add_bullet("Despliegue 100% web en cualquier dispositivo sin instalaciones locales.", "• Plaza:")
    add_bullet("Primer mes de prueba gratuita y 15% de descuento por pago anual.", "• Promoción:")

    add_h2("10.3 Proceso de Venta")
    add_p("Prospección directa a administradores ➔ Demostración presencial de 15 minutos en consejo de administración ➔ Periodo de prueba asistido de 15 días ➔ Cierre y firma del contrato de suscripción mensual.")

    # ==========================================
    # CAPÍTULO 11: ESTUDIO FINANCIERO
    # ==========================================
    add_h1("11. Estudio Financiero")

    add_h2("11.1 Inversión Inicial Requerida")
    headers_inv = ["Rubro", "Detalle", "Monto (COP)"]
    data_inv = [
        ["Infraestructura Cloud", "Servidores, dominios y base de datos Redis (Año 1)", "$2.400.000"],
        ["Formalización Legal", "Constitución SAS, Cámara de Comercio, registro DNDA", "$1.800.000"],
        ["Equipos y Pruebas", "Equipos de cómputo para desarrollo y garita piloto", "$6.500.000"],
        ["Marketing y Ventas", "Material comercial, publicidad inicial y transporte", "$2.300.000"],
        ["Fondo de Maniobra", "Capital de trabajo de reserva primeros 3 meses", "$1.500.000"],
        ["TOTAL INVERSIÓN INICIAL", "Monto total para inicio de operaciones", "$14.500.000"]
    ]
    add_styled_table(headers_inv, data_inv, [Inches(2.0), Inches(3.0), Inches(1.5)])

    add_h2("11.2 Costos Operativos Mensuales")
    add_bullet("$2.110.000 COP (Servidores cloud, comunicaciones, honorarios de soporte y gastos contables).", "• Costos Fijos Mensuales:")
    add_bullet("$15.000 COP por conjunto residencial activo (consumo marginal de base de datos).", "• Costos Variables Unitarios:")

    add_h2("11.3 Estado de Resultados Proyectado a 3 Años (Cifras en COP)")
    headers_pyg = ["Concepto Financiero", "Año 1 (28 Conjuntos)", "Año 2 (60 Conjuntos)", "Año 3 (110 Conjuntos)"]
    data_pyg = [
        ["Ingresos Operacionales", "$62.400.000", "$168.000.000", "$324.000.000"],
        ["Costos Variables", "$4.200.000", "$10.800.000", "$19.800.000"],
        ["Margen Bruto", "$58.200.000", "$157.200.000", "$304.200.000"],
        ["Gastos Operacionales y Fijos", "$32.500.000", "$68.400.000", "$112.000.000"],
        ["Utilidad Antes de Impuestos", "$25.700.000", "$88.800.000", "$192.200.000"],
        ["Impuestos Estimados (35%)", "$8.995.000", "$31.080.000", "$67.270.000"],
        ["UTILIDAD NETA", "$16.705.000", "$57.720.000", "$124.930.000"]
    ]
    add_styled_table(headers_pyg, data_pyg, [Inches(2.2), Inches(1.4), Inches(1.4), Inches(1.5)])

    add_h2("11.4 Punto de Equilibrio y Rentabilidad")
    add_p("Con costos fijos mensuales de $2.110.000 COP y un margen de contribución unitario de $245.000 COP, el punto de equilibrio operativo se alcanza con **9 conjuntos residenciales activos** (mes 8 de operación).")
    
    add_callout(doc, [
        "Valor Presente Neto (VPN): $74.850.000 COP (Tasa de descuento 15%)",
        "Tasa Interna de Retorno (TIR): 38.4% anual",
        "Periodo de Recuperación (PRI): 11.2 meses",
        "Financiación: 60% recursos propios de fundadores, 40% fondo de emprendimiento universitario."
    ], title="EVALUACIÓN FINANCIERA DEL PROYECTO")

    # ==========================================
    # CAPÍTULO 12: GESTIÓN DE RIESGOS
    # ==========================================
    add_h1("12. Gestión de Riesgos")
    headers_risk = ["Tipo de Riesgo", "Descripción del Riesgo", "Medida de Mitigación y Contingencia"]
    data_risk = [
        ["Comercial", "Resistencia de administradores tradicionales al cambio", "Pruebas piloto gratuitas de 15 días y demostraciones presenciales"],
        ["Operativo", "Fallas temporales de Internet en garita", "Arquitectura PWA con almacenamiento local que sincroniza automáticamente"],
        ["Ciberseguridad", "Intentos de acceso no autorizado o ataques de fuerza bruta", "Tokens JWT, hasheo con Bcrypt, rate limiters y copias de seguridad diarias"],
        ["Legal", "Manejo inadecuado de datos personales de visitantes", "Aviso de privacidad visible en garita y despersonalización según Ley 1581"]
    ]
    add_styled_table(headers_risk, data_risk, [Inches(1.5), Inches(2.4), Inches(2.6)])

    # ==========================================
    # CAPÍTULO 13: SOSTENIBILIDAD E IMPACTO
    # ==========================================
    add_h1("13. Sostenibilidad e Impacto")
    add_bullet("Ahorro de más del 65% en costos de papelería, impresiones y horas extras en conteo de asambleas.", "• Impacto Económico:")
    add_bullet("Mejora la convivencia ciudadana, dignifica la labor del guarda de seguridad y brinda transparencia en las cuentas comunitarias.", "• Impacto Social:")
    add_bullet("Cada conjunto que adopta MinutaTech evita el uso de más de 2.500 hojas de papel al año, reduciendo la huella de carbono.", "• Impacto Ambiental:")
    add_bullet("Aporta directamente al ODS 9 (Innovación), ODS 11 (Ciudades y Comunidades Sostenibles) y ODS 12 (Consumo Responsable).", "• ODS Vinculados:")

    # ==========================================
    # CAPÍTULO 14: PLAN DE IMPLEMENTACIÓN
    # ==========================================
    add_h1("14. Plan de Implementación")
    add_p("El cronograma de lanzamiento se divide en 4 fases estratégicas:")
    add_bullet("Ajustes finales del software con 3 conjuntos piloto en Ibagué.", "• Fase 1 (Meses 1 - 2): Validación y Pruebas Piloto:")
    add_bullet("Registro mercantil SAS, registro de marca y campaña comercial inicial.", "• Fase 2 (Meses 3 - 4): Formalización y Lanzamiento:")
    add_bullet("Captación de 25 conjuntos en Tolima y Eje Cafetero.", "• Fase 3 (Meses 5 - 12): Expansión Regional:")
    add_bullet("Integración de pasarela de pagos y citofonía IP.", "• Fase 4 (Año 2 en adelante): Consolidación:")

    # ==========================================
    # CAPÍTULO 15: CONCLUSIONES (MAPEO 1 A 1 CON OBJETIVOS ESPECÍFICOS)
    # ==========================================
    add_h1("15. Conclusiones y Recomendaciones")

    add_h2("15.1 Conclusiones del Proyecto (Mapeadas a los Objetivos Específicos)")
    add_p("Las conclusiones del presente plan de negocios responden directamente al cumplimiento de cada uno de los cuatro objetivos específicos formulados:")

    add_bullet(
        "El desarrollo del módulo de minuta digital y paquetería segura con código PIN demostró una reducción del 100% en el uso de papel en garitas y eliminó por completo los errores en la entrega de correspondencia, protegiendo tanto la privacidad del residente como la responsabilidad del guarda de seguridad.",
        "1. Cumplimiento Objetivo 1 (Minuta Digital y Paquetería PIN):"
    )

    add_bullet(
        "El motor de votaciones en tiempo real para asambleas permitió automatizar el cálculo del quórum y de los resultados ponderados por coeficientes de copropiedad en estricto cumplimiento de la Ley 675 de 2001, reduciendo la duración de las asambleas de 5 horas a menos de 90 minutos y erradicando impugnaciones por recuentos manuales.",
        "2. Cumplimiento Objetivo 2 (Asambleas y Quórum Ley 675):"
    )

    add_bullet(
        "La integración del módulo de PQRS automatizó el cómputo del plazo legal de 15 días hábiles establecido en la Ley 1755 de 2015, proporcionando alertas tempranas de vencimiento y respuestas oficiales documentadas, lo cual disminuye el riesgo de acciones de tutela y sanciones contra la administración.",
        "3. Cumplimiento Objetivo 3 (PQRS y Plazos Ley 1755):"
    )

    add_bullet(
        "La validación del modelo de negocio y las pruebas piloto realizadas en conjuntos residenciales de Ibagué confirmaron la viabilidad comercial y financiera del proyecto, alcanzando el punto de equilibrio en el mes 8 con solo 9 copropiedades activas, un VPN de $74.850.000 COP y una TIR del 38.4% a tres años.",
        "4. Cumplimiento Objetivo 4 (Validación y Viabilidad de Negocio):"
    )

    add_h2("15.2 Recomendaciones")
    add_bullet("Aprovechar la temporada de asambleas ordinarias (febrero - abril) para realizar la mayor fuerza comercial en copropiedades.", "• Comercialización:")
    add_bullet("Postular el proyecto a convocatorias de capital semilla como Fondo Emprender del SENA para acelerar la expansión a Bogotá.", "• Financiación:")

    # ==========================================
    # REFERENCIAS
    # ==========================================
    add_h1("Referencias Bibliográficas")
    add_p("Belmonte, A. V. (2023). Marketing y plan de negocio de la microempresa. Editorial IC.")
    add_p("Cámara de Comercio de Bogotá. (2011). Guía para la formulación y elaboración de tu Plan de empresa. Bogotá Emprende.")
    add_p("Congreso de la República de Colombia. (2001). Ley 675 de 2001: Régimen de Propiedad Horizontal. Diario Oficial No. 44.509.")
    add_p("Congreso de la República de Colombia. (2012). Ley Estatutaria 1581 de 2012: Disposiciones generales para la protección de datos personales. Diario Oficial No. 48.587.")
    add_p("Congreso de la República de Colombia. (2015). Ley 1755 de 2015: Regulación del derecho fundamental de petición. Diario Oficial No. 49.560.")
    add_p("Delgado Quintero, A. P. (2025). Guía para la elaboración de un Plan de Negocio. Instituto de Idiomas, Programa ECO, Universidad del Norte.")
    add_p("Gaytán Cortés, J. (2020). El plan de negocios y la rentabilidad. Revista Mercados y Negocios, 21(42), 143-156.")
    add_p("Pressman, R. S., & Maxim, B. R. (2020). Ingeniería del software: Un enfoque práctico (9na ed.). McGraw-Hill.")
    add_p("Varela, R. (2001). Innovación empresarial: Arte y ciencia en la creación de empresas. Prentice Hall.")

    output_dir = os.path.join(os.path.dirname(__file__), "..", "docs")
    os.makedirs(output_dir, exist_ok=True)
    docx_path = os.path.abspath(os.path.join(output_dir, "Plan_de_Negocios_MinutaTech_UT.docx"))
    doc.save(docx_path)
    print(f"Documento DOCX generado exitosamente en: {docx_path}")
    return docx_path

def convert_to_pdf(docx_path):
    """Convierte el archivo DOCX a PDF usando Microsoft Word via COM"""
    import win32com.client
    pdf_path = os.path.splitext(docx_path)[0] + ".pdf"
    
    word = None
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(docx_path)
        # FileFormat 17 es wdFormatPDF
        doc.SaveAs(pdf_path, FileFormat=17)
        doc.Close()
        print(f"Documento PDF generado exitosamente en: {pdf_path}")
        return pdf_path
    except Exception as e:
        print(f"Error al convertir a PDF via Word COM: {e}")
        return None
    finally:
        if word:
            word.Quit()

if __name__ == "__main__":
    docx_file = build_document()
    pdf_file = convert_to_pdf(docx_file)
    print("PROCESO COMPLETADO EXITOSAMENTE.")
