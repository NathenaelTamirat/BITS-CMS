import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MediaPicker, {
  emptyMedia,
  type MediaFormValue,
} from "./MediaPicker";

export interface GalleryItem {
  id: string;
  media: MediaFormValue;
}

interface Props {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  max?: number;
}

export default function GalleryEditor({ items, onChange, max = 6 }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        onChange(arrayMove(items, oldIndex, newIndex));
      }
    }
  }

  function updateItem(id: string, media: MediaFormValue) {
    onChange(items.map((i) => (i.id === id ? { ...i, media } : i)));
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function addItem() {
    if (items.length >= max) return;
    onChange([...items, { id: crypto.randomUUID(), media: { ...emptyMedia } }]);
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item, idx) => (
            <SortableSlot
              key={item.id}
              item={item}
              position={idx + 1}
              onChange={(media) => updateItem(item.id, media)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length < max ? (
        <button
          type="button"
          onClick={addItem}
          className="flex w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-brand-bg py-4 text-sm font-medium text-brand-muted transition-colors hover:border-brand-green hover:text-brand-green-dark"
        >
          + Add gallery item ({items.length}/{max})
        </button>
      ) : (
        <p className="text-center text-xs text-brand-muted">
          Maximum {max} gallery items reached.
        </p>
      )}
    </div>
  );
}

interface SortableSlotProps {
  item: GalleryItem;
  position: number;
  onChange: (media: MediaFormValue) => void;
  onRemove: () => void;
}

function SortableSlot({
  item,
  position,
  onChange,
  onRemove,
}: SortableSlotProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-3">
      <div className="flex flex-col items-center pt-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab rounded p-1 text-brand-muted hover:bg-gray-100 hover:text-brand-charcoal active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="4" cy="3" r="1.2" fill="currentColor" />
            <circle cx="10" cy="3" r="1.2" fill="currentColor" />
            <circle cx="4" cy="7" r="1.2" fill="currentColor" />
            <circle cx="10" cy="7" r="1.2" fill="currentColor" />
            <circle cx="4" cy="11" r="1.2" fill="currentColor" />
            <circle cx="10" cy="11" r="1.2" fill="currentColor" />
          </svg>
        </button>
        <span className="mt-1 text-[10px] font-medium text-brand-muted">
          {position}
        </span>
      </div>
      <div className="flex-1">
        <MediaPicker value={item.media} onChange={onChange} />
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-brand-muted hover:text-red-600"
          >
            Remove item
          </button>
        </div>
      </div>
    </div>
  );
}
