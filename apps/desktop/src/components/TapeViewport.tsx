import React, { useRef, useState } from "react";
import type { ConfigurationView } from "../types/tm";
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";

interface TapeViewportProps {
  configuration: ConfigurationView | null;
  blankSymbol: string;
  reducedMotion: boolean;
  onCellClick?: (index: number) => void;
}

export const TapeViewport: React.FC<TapeViewportProps> = ({
  configuration,
  blankSymbol,
  reducedMotion,
  onCellClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  const headPosition = configuration?.head_position ?? 0;

  // Center pan on head whenever head changes (if user wants auto-centering)
  const centerOnHead = () => {
    setPanOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX - panOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset(e.clientX - dragStartX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cell dimensions in SVG units
  const cellWidth = 56 * zoomLevel;
  const cellHeight = 60 * zoomLevel;
  const tapeY = 50;

  // Window of visible cells around head + pan
  const radius = Math.ceil(24 / zoomLevel);
  const effectiveCenter = headPosition - Math.round(panOffset / cellWidth);
  const startIdx = effectiveCenter - radius;
  const endIdx = effectiveCenter + radius;

  const cells = [];
  for (let idx = startIdx; idx <= endIdx; idx++) {
    const symbol =
      configuration?.non_blank_cells[idx] ??
      (idx === headPosition && configuration?.visible_tape
        ? configuration.visible_tape.find((c) => c.index === idx)?.symbol ?? blankSymbol
        : blankSymbol);
    const isBlank = symbol === blankSymbol;
    const isHead = idx === headPosition;
    cells.push({ index: idx, symbol, isBlank, isHead });
  }

  // Non-blank range
  const minIdx = configuration?.min_index;
  const maxIdx = configuration?.max_index;

  return (
    <div className="tape-card">
      <div className="tape-header">
        <div className="tape-title-group">
          <span className="section-title">Infinite Two-Way Tape (Γ)</span>
          {minIdx !== null && minIdx !== undefined && maxIdx !== null && maxIdx !== undefined ? (
            <span className="tape-range-badge">
              Active span: [{minIdx} .. {maxIdx}] ({maxIdx - minIdx + 1} cells)
            </span>
          ) : (
            <span className="tape-range-badge">Tape is blank</span>
          )}
        </div>

        {/* Viewport controls */}
        <div className="tape-viewport-toolbar">
          <button
            onClick={() => setPanOffset((prev) => prev + cellWidth * 3)}
            className="btn-icon"
            title="Pan Left (←)"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={centerOnHead}
            className="btn-secondary btn-sm"
            title="Recenter viewport on head (Index 0)"
          >
            <Crosshair size={14} className="mr-1" />
            Head [{headPosition}]
          </button>
          <button
            onClick={() => setPanOffset((prev) => prev - cellWidth * 3)}
            className="btn-icon"
            title="Pan Right (→)"
          >
            <ChevronRight size={16} />
          </button>

          <div className="toolbar-divider" />

          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="btn-icon"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="btn-icon"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset(0);
            }}
            className="btn-icon"
            title="Reset View"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="tape-canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <svg
          className="tape-svg"
          width="100%"
          height="160"
          viewBox="-500 0 1000 160"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="head-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.4" />
            </filter>
            <linearGradient id="head-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="cell-active-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Grid ruler lines */}
          <line x1="-500" y1={tapeY} x2="500" y2={tapeY} stroke="#334155" strokeWidth="2" />
          <line
            x1="-500"
            y1={tapeY + cellHeight}
            x2="500"
            y2={tapeY + cellHeight}
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Cells */}
          {cells.map((cell) => {
            const cellCenterX = (cell.index - headPosition) * cellWidth + panOffset;
            const cellLeft = cellCenterX - cellWidth / 2;

            return (
              <g
                key={cell.index}
                transform={`translate(${cellLeft}, ${tapeY})`}
                onClick={() => onCellClick?.(cell.index)}
                className="tape-cell-group"
              >
                {/* Cell Box */}
                <rect
                  x="0"
                  y="0"
                  width={cellWidth - 2}
                  height={cellHeight}
                  rx="6"
                  fill={cell.isHead ? "url(#cell-active-grad)" : "#1e293b"}
                  stroke={cell.isHead ? "#38bdf8" : "#334155"}
                  strokeWidth={cell.isHead ? 2.5 : 1}
                  className="transition-colors duration-200"
                />

                {/* Index label above cell */}
                <text
                  x={(cellWidth - 2) / 2}
                  y="-8"
                  textAnchor="middle"
                  fill={cell.isHead ? "#38bdf8" : "#64748b"}
                  fontSize={11 * zoomLevel}
                  fontWeight={cell.isHead ? "bold" : "normal"}
                  fontFamily="monospace"
                >
                  {cell.index}
                </text>

                {/* Symbol */}
                <text
                  x={(cellWidth - 2) / 2}
                  y={cellHeight / 2 + 6 * zoomLevel}
                  textAnchor="middle"
                  fill={
                    cell.isBlank
                      ? "#475569"
                      : cell.isHead
                      ? "#38bdf8"
                      : "#f1f5f9"
                  }
                  fontSize={22 * zoomLevel}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {cell.isBlank ? "·" : cell.symbol}
                </text>
              </g>
            );
          })}

          {/* Read/Write Head Marker (points up to the cell at headPosition) */}
          <g
            transform={`translate(${panOffset}, ${tapeY + cellHeight + 6})`}
            filter="url(#head-shadow)"
            style={{
              transition: reducedMotion ? "none" : "transform 0.18s ease-out",
            }}
          >
            {/* Arrow pointing up */}
            <polygon
              points="0,0 -12,14 -4,14 -4,26 4,26 4,14 12,14"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            {/* Head Badge */}
            <rect
              x="-36"
              y="28"
              width="72"
              height="22"
              rx="4"
              fill="#0369a1"
              stroke="#38bdf8"
              strokeWidth="1"
            />
            <text
              x="0"
              y="43"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              HEAD [{headPosition}]
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
