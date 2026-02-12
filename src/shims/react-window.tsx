import React from 'react';

export interface ListChildComponentProps<T = unknown> {
  index: number;
  style: React.CSSProperties;
  data: T;
}

interface FixedSizeListProps<T = unknown> {
  height: number;
  width: number | string;
  itemCount: number;
  itemSize: number;
  overscanCount?: number;
  itemData: T;
  children: (props: ListChildComponentProps<T>) => React.ReactNode;
}

export function FixedSizeList<T = unknown>({
  height,
  width,
  itemCount,
  itemSize,
  overscanCount = 4,
  itemData,
  children
}: FixedSizeListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const viewportHeight = Math.max(height, itemSize);
  const totalHeight = itemCount * itemSize;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - overscanCount);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + viewportHeight) / itemSize) + overscanCount
  );

  const items: React.ReactNode[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    items.push(
      <div
        key={index}
        style={{
          position: 'absolute',
          top: index * itemSize,
          left: 0,
          width: '100%',
          height: itemSize
        }}
      >
        {children({ index, style: { height: itemSize, width: '100%' }, data: itemData })}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        height: viewportHeight,
        width
      }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      className="custom-scrollbar"
    >
      <div style={{ position: 'relative', height: totalHeight, width: '100%' }}>{items}</div>
    </div>
  );
}
