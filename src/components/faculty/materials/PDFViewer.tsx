import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tooltip from "../../Tooltip";

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch {
  // worker fallback
}

export interface PDFViewerProps {
  url: string;
  fileName: string;
  onDownload?: () => void;
}

export default function PDFViewer({ url, fileName: _fileName, onDownload }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument({
      url,
      withCredentials: true,
    });

    loadingTask.promise
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("PDF loading error:", err);
          const isInvalid =
            err?.name === "InvalidPDFException" ||
            err?.message?.toLowerCase().includes("invalid pdf");
          const isMissing =
            err?.name === "MissingPDFException" ||
            err?.message?.toLowerCase().includes("missing pdf") ||
            err?.status === 404;
          setError(
            isInvalid
              ? "Invalid PDF structure: The document appears to be corrupted or not a valid PDF. You can download the original file below."
              : isMissing
              ? "The PDF file could not be found or has been removed. You can download the original file or re-upload a valid copy."
              : "Failed to load PDF document. You can download the original file below."
          );
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      try {
        loadingTask.destroy();
      } catch {
        // ignore
      }
    };
  }, [url]);

  // Render Current Page onto Canvas
  const renderPage = useCallback(
    async (pageNumber: number, currentScale: number, currentRotation: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({
          scale: currentScale,
          rotation: currentRotation,
        });

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(pixelRatio, pixelRatio);

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("PDF page render error:", err);
        }
      }
    },
    [pdfDoc]
  );

  useEffect(() => {
    if (pdfDoc && !loading) {
      renderPage(currentPage, scale, rotation);
    }
  }, [pdfDoc, currentPage, scale, rotation, loading, renderPage]);

  // Page Navigation Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // Zoom Handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    pdfDoc.getPage(currentPage).then((page: any) => {
      const baseViewport = page.getViewport({ scale: 1, rotation });
      const containerWidth = containerRef.current?.clientWidth || 800;
      const fitScale = (containerWidth - 64) / baseViewport.width;
      setScale(Math.max(0.6, Math.min(fitScale, 2.5)));
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`pdf-viewer-container ${isFullscreen ? "pdf-viewer-container--fullscreen" : ""}`}
    >
      {/* Viewer Toolbar */}
      <div className="pdf-viewer-toolbar">
        {/* Left: Page Navigation */}
        <div className="pdf-viewer-toolbar-group">
          <Tooltip label="Previous page">
            <button
              type="button"
              className="pdf-viewer-btn"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
              aria-label="Previous page"
            >
              ◀
            </button>
          </Tooltip>

          <span className="pdf-viewer-page-indicator">
            Page {currentPage} of {totalPages || 1}
          </span>

          <Tooltip label="Next page">
            <button
              type="button"
              className="pdf-viewer-btn"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || loading}
              aria-label="Next page"
            >
              ▶
            </button>
          </Tooltip>
        </div>

        {/* Center: Zoom Controls */}
        <div className="pdf-viewer-toolbar-group">
          <Tooltip label="Zoom out">
            <button
              type="button"
              className="pdf-viewer-btn"
              onClick={handleZoomOut}
              disabled={loading || scale <= 0.5}
              aria-label="Zoom out"
            >
              －
            </button>
          </Tooltip>

          <span className="pdf-viewer-scale-text">{Math.round(scale * 100)}%</span>

          <Tooltip label="Zoom in">
            <button
              type="button"
              className="pdf-viewer-btn"
              onClick={handleZoomIn}
              disabled={loading || scale >= 3.0}
              aria-label="Zoom in"
            >
              ＋
            </button>
          </Tooltip>

          <Tooltip label="Fit to width">
            <button
              type="button"
              className="pdf-viewer-btn pdf-viewer-btn--pill"
              onClick={handleFitWidth}
              disabled={loading}
            >
              Fit Width
            </button>
          </Tooltip>

          <Tooltip label="Rotate 90 degrees">
            <button
              type="button"
              className="pdf-viewer-btn"
              onClick={handleRotate}
              disabled={loading}
              aria-label="Rotate"
            >
              ↻
            </button>
          </Tooltip>
        </div>

        {/* Right: Actions */}
        <div className="pdf-viewer-toolbar-group">
          <Tooltip label={isFullscreen ? "Exit full screen" : "Full screen"}>
            <button
              type="button"
              className="pdf-viewer-btn"
              onClick={handleToggleFullscreen}
              aria-label="Toggle full screen"
            >
              ⛶
            </button>
          </Tooltip>

          {onDownload && (
            <Tooltip label="Download PDF document">
              <button
                type="button"
                className="mgmt-btn mgmt-btn--primary mgmt-btn--sm"
                onClick={onDownload}
              >
                Download PDF
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="pdf-viewer-stage">
        {loading && (
          <div className="pdf-viewer-loading">
            <div className="pdf-viewer-spinner" aria-hidden="true" />
            <p>Loading PDF document...</p>
          </div>
        )}

        {error && (
          <div className="pdf-viewer-error-box">
            <p className="pdf-viewer-error-msg">{error}</p>
            {onDownload && (
              <button
                type="button"
                className="mgmt-btn mgmt-btn--primary"
                onClick={onDownload}
              >
                Download Original File
              </button>
            )}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`pdf-viewer-canvas ${loading || error ? "pdf-viewer-canvas--hidden" : ""}`}
        />
      </div>
    </div>
  );
}
