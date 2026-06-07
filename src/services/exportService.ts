import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { ChoirProject } from '../types/project';

function fileSafeTitle(project: ChoirProject): string {
  return `${project.title || 'sofatonic-score'}`.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '');
}

async function capturePage(page: HTMLElement, pixelRatio: number): Promise<string> {
  document.body.classList.add('exporting-score');
  try {
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    return await toPng(page, {
      pixelRatio,
      backgroundColor: '#ffffff',
      filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-export-ignore'))
    });
  } finally {
    document.body.classList.remove('exporting-score');
  }
}

function createMergedExportPages(pages: HTMLElement[]): { pages: HTMLElement[]; cleanup: () => void } {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.background = '#fff';
  document.body.appendChild(host);

  const merged: HTMLElement[] = [];
  for (let index = 0; index < pages.length; index += 2) {
    const page = pages[index].cloneNode(true) as HTMLElement;
    const targetStack = page.querySelector('.a4-block-stack');
    const nextStack = pages[index + 1]?.querySelector('.a4-block-stack');
    nextStack?.querySelectorAll('.satb-block').forEach((block) => {
      targetStack?.appendChild(block.cloneNode(true));
    });
    host.appendChild(page);
    merged.push(page);
  }

  return { pages: merged, cleanup: () => host.remove() };
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
}

async function saveOrShareDataUrl(fileName: string, dataUrl: string, title: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: dataUrlToBase64(dataUrl),
      directory: Directory.Cache,
      recursive: true
    });

    await Share.share({
      title,
      text: fileName,
      url: result.uri,
      files: [result.uri],
      dialogTitle: title
    });
    return;
  }

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export async function exportProjectPdf(project: ChoirProject, pages: HTMLElement[]): Promise<void> {
  if (!pages.length) {
    throw new Error('No notation pages are available for PDF export.');
  }

  const exportDom = createMergedExportPages(pages);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  try {
    for (let index = 0; index < exportDom.pages.length; index += 1) {
      if (index > 0) doc.addPage('a4', 'portrait');
      const image = await capturePage(exportDom.pages[index], 2);
      doc.addImage(image, 'PNG', 0, 0, 595.28, 841.89);
    }
  } finally {
    exportDom.cleanup();
  }
  const fileName = `${fileSafeTitle(project)}.pdf`;
  if (Capacitor.isNativePlatform()) {
    await saveOrShareDataUrl(fileName, doc.output('datauristring'), 'Export SofaTonic PDF');
    return;
  }

  doc.save(fileName);
}

export async function exportProjectPng(project: ChoirProject, pages: HTMLElement[]): Promise<void> {
  if (!pages.length) {
    throw new Error('No notation pages are available for PNG export.');
  }

  const exportDom = createMergedExportPages(pages);
  try {
    for (let index = 0; index < exportDom.pages.length; index += 1) {
      const image = await capturePage(exportDom.pages[index], 3);
      await saveOrShareDataUrl(`${fileSafeTitle(project)}-page-${index + 1}.png`, image, 'Export SofaTonic PNG');
    }
  } finally {
    exportDom.cleanup();
  }
}
