
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DragAndDropProviderProps {
  children: React.ReactNode;
}

export default function DragAndDropProvider({ children }: DragAndDropProviderProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
}
