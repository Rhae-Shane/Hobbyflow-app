import type { MindMapNode } from '@/types/roadmap.types';

export type LaidOutNode = {
  id: string;
  label: string;
  colorIndex: number;
  lessonNodeIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  hasChildren: boolean;
  parentId: string | null;
};

export type LaidOutEdge = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

export type MindMapLayout = {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
};

const NODE_W = 148;
const NODE_H = 44;
const H_GAP = 72;
const V_GAP = 20;
const PAD = 24;

export function layoutMindMap(
  root: MindMapNode,
  collapsed: Set<string>,
  scale = 1,
): MindMapLayout {
  const nodeW = NODE_W * scale;
  const nodeH = NODE_H * scale;
  const hGap = H_GAP * scale;
  const vGap = V_GAP * scale;
  const pad = PAD * scale;

  type Measured = {
    node: MindMapNode;
    depth: number;
    subtreeHeight: number;
    children: Measured[];
  };

  function measure(node: MindMapNode, depth: number): Measured {
    const kids =
      collapsed.has(node.id) || node.children.length === 0
        ? []
        : node.children.map((c) => measure(c, depth + 1));
    const subtreeHeight =
      kids.length === 0
        ? nodeH
        : kids.reduce((sum, c) => sum + c.subtreeHeight, 0) + vGap * (kids.length - 1);
    return { node, depth, subtreeHeight, children: kids };
  }

  function place(
    measured: Measured,
    x: number,
    yTop: number,
    parentId: string | null,
    outNodes: LaidOutNode[],
    outEdges: LaidOutEdge[],
  ) {
    const y = yTop + measured.subtreeHeight / 2 - nodeH / 2;
    const laid: LaidOutNode = {
      id: measured.node.id,
      label: measured.node.label,
      colorIndex: measured.node.colorIndex ?? Math.min(measured.depth, 2),
      lessonNodeIds: measured.node.lessonNodeIds,
      x,
      y,
      width: nodeW,
      height: nodeH,
      depth: measured.depth,
      hasChildren: measured.node.children.length > 0,
      parentId,
    };
    outNodes.push(laid);

    let childTop = yTop;
    for (const child of measured.children) {
      const childX = x + nodeW + hGap;
      place(child, childX, childTop, measured.node.id, outNodes, outEdges);
      const childY = childTop + child.subtreeHeight / 2 - nodeH / 2;
      outEdges.push({
        id: `${measured.node.id}->${child.node.id}`,
        fromX: x + nodeW,
        fromY: y + nodeH / 2,
        toX: childX,
        toY: childY + nodeH / 2,
      });
      childTop += child.subtreeHeight + vGap;
    }
  }

  const measured = measure(root, 0);
  const nodes: LaidOutNode[] = [];
  const edges: LaidOutEdge[] = [];
  place(measured, pad, pad, null, nodes, edges);

  const width = Math.max(...nodes.map((n) => n.x + n.width), nodeW) + pad;
  const height = Math.max(...nodes.map((n) => n.y + n.height), nodeH) + pad;

  return { nodes, edges, width, height };
}

export const mindMapColors = {
  canvas: '#F7F3EA',
  rootBg: '#E8F4FC',
  rootBorder: '#5BA3D9',
  midBg: '#EDE4F5',
  midBorder: '#9B7BB8',
  leafBg: '#E4F0E6',
  leafBorder: '#7BA87B',
  edge: '#C8C0B4',
  selectedRing: '#2C2416',
  sidebar: '#FFFFFF',
  statusPill: '#EFEAE0',
} as const;

export function colorsForIndex(colorIndex: number): { bg: string; border: string } {
  if (colorIndex <= 0) return { bg: mindMapColors.rootBg, border: mindMapColors.rootBorder };
  if (colorIndex === 1) return { bg: mindMapColors.midBg, border: mindMapColors.midBorder };
  return { bg: mindMapColors.leafBg, border: mindMapColors.leafBorder };
}
