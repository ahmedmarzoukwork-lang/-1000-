import { toPng } from "html-to-image";

/**
 * Exports a specific DOM element as a complete, full-height, high-resolution PNG image.
 * Ensures the entire card (all sections, warnings, and citations) is captured without
 * clipping or scrollbars.
 */
export async function exportElementAsPng(
  elementId: string,
  fileName: string = "1000-herbs-export"
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found for PNG export.`);
    return false;
  }

  // Backup original styles and scroll position
  const prevOverflow = element.style.overflow;
  const prevOverflowY = element.style.overflowY;
  const prevMaxHeight = element.style.maxHeight;
  const prevHeight = element.style.height;
  const prevWidth = element.style.width;
  const prevScrollTop = element.scrollTop;

  const parent = element.parentElement;
  const prevParentOverflow = parent?.style.overflow;
  const prevParentOverflowY = parent?.style.overflowY;
  const prevParentMaxHeight = parent?.style.maxHeight;
  const prevParentHeight = parent?.style.height;

  try {
    // 1. Reset scroll position to capture from the absolute top
    element.scrollTop = 0;

    // 2. Temporarily unclamp restrictions on element and parent so it expands to 100% natural height
    element.style.overflow = "visible";
    element.style.overflowY = "visible";
    element.style.maxHeight = "none";
    element.style.height = "auto";

    if (parent) {
      parent.style.overflow = "visible";
      parent.style.overflowY = "visible";
      parent.style.maxHeight = "none";
      parent.style.height = "auto";
    }

    // 3. Compute accurate full dimensions of all content
    const fullHeight = Math.max(element.scrollHeight, element.offsetHeight, 650);
    const fullWidth = Math.max(element.scrollWidth, element.offsetWidth, 750);

    // 4. Capture at crisp 3x pixel ratio for professional print/monograph quality
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 3, // Ultra-crisp 3x resolution
      backgroundColor: "#FBF7EE", // Papyrus parchment background
      skipFonts: true, // Prevents cross-origin cssRules read errors
      width: fullWidth,
      height: fullHeight,
      style: {
        overflow: "visible",
        overflowY: "visible",
        maxHeight: "none",
        height: `${fullHeight}px`,
        width: `${fullWidth}px`,
        transform: "none",
      },
      filter: (node) => {
        // Exclude elements marked with no-export class
        if (node instanceof HTMLElement && node.classList.contains("no-export")) {
          return false;
        }
        return true;
      },
    });

    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (error) {
    console.error("Error exporting complete element to PNG:", error);
    return false;
  } finally {
    // 5. Restore original styles and scroll position
    element.style.overflow = prevOverflow;
    element.style.overflowY = prevOverflowY;
    element.style.maxHeight = prevMaxHeight;
    element.style.height = prevHeight;
    element.style.width = prevWidth;
    element.scrollTop = prevScrollTop;

    if (parent) {
      if (prevParentOverflow !== undefined) parent.style.overflow = prevParentOverflow;
      if (prevParentOverflowY !== undefined) parent.style.overflowY = prevParentOverflowY;
      if (prevParentMaxHeight !== undefined) parent.style.maxHeight = prevParentMaxHeight;
      if (prevParentHeight !== undefined) parent.style.height = prevParentHeight;
    }
  }
}

/**
 * Triggers standard browser print dialog for saving as PDF or physical printing.
 */
export function printPageAsPdf(): void {
  window.print();
}
