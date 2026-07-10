import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { MindMapNode } from '@/types/roadmap.types';
import {
  colorsForIndex,
  layoutMindMap,
  mindMapColors,
  type LaidOutNode,
} from '@/lib/roadmap/mindMapLayout';

type Props = {
  root: MindMapNode;
  selectedId: string | null;
  collapsed: Set<string>;
  scale: number;
  onSelect: (node: LaidOutNode) => void;
  onToggleCollapse: (nodeId: string) => void;
  onCanvasLayout?: (size: { width: number; height: number }) => void;
};

function EdgePath({
  fromX,
  fromY,
  toX,
  toY,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}) {
  const midX = fromX + (toX - fromX) / 2;
  const top = Math.min(fromY, toY);
  const height = Math.abs(toY - fromY) || 2;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: fromX,
          top: fromY - 1,
          width: Math.max(midX - fromX, 1),
          height: 2,
          backgroundColor: mindMapColors.edge,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: midX - 1,
          top,
          width: 2,
          height,
          backgroundColor: mindMapColors.edge,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: midX,
          top: toY - 1,
          width: Math.max(toX - midX, 1),
          height: 2,
          backgroundColor: mindMapColors.edge,
        }}
      />
    </View>
  );
}

export function MindMapCanvas({
  root,
  selectedId,
  collapsed,
  scale,
  onSelect,
  onToggleCollapse,
  onCanvasLayout,
}: Props) {
  const layout = useMemo(() => layoutMindMap(root, collapsed, scale), [root, collapsed, scale]);

  const handleLayout = (e: LayoutChangeEvent) => {
    onCanvasLayout?.({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  };

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      <ScrollView
        horizontal
        style={styles.scroll}
        contentContainerStyle={{
          width: layout.width + 48,
          height: layout.height + 48,
          padding: 16,
        }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: layout.width,
            height: layout.height,
          }}
        >
          <View style={{ width: layout.width, height: layout.height }}>
            {layout.edges.map((edge) => (
              <EdgePath key={edge.id} {...edge} />
            ))}
            {layout.nodes.map((node) => {
              const colors = colorsForIndex(node.colorIndex);
              const selected = selectedId === node.id;
              return (
                <View
                  key={node.id}
                  style={[
                    styles.nodeWrap,
                    {
                      left: node.x,
                      top: node.y,
                      width: node.width,
                      height: node.height,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => onSelect(node)}
                    style={[
                      styles.node,
                      {
                        backgroundColor: colors.bg,
                        borderColor: selected ? mindMapColors.selectedRing : colors.border,
                        borderWidth: selected ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text numberOfLines={2} style={styles.nodeLabel}>
                      {node.label}
                    </Text>
                  </Pressable>
                  {node.hasChildren ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => onToggleCollapse(node.id)}
                      style={[styles.chevron, { borderColor: colors.border }]}
                    >
                      <Text style={styles.chevronText}>
                        {collapsed.has(node.id) ? '›' : '‹'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: mindMapColors.canvas,
    flex: 1,
    minHeight: 220,
  },
  scroll: {
    flex: 1,
  },
  nodeWrap: {
    position: 'absolute',
  },
  node: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nodeLabel: {
    color: '#2C2416',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  chevron: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -10,
    top: 12,
    width: 20,
  },
  chevronText: {
    color: '#6B5E52',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
});
