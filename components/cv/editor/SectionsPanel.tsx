'use client';
import { CVSection } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

const SECTION_INFO: Record<CVSection, { label: string; emoji: string; required?: boolean }> = {
  personalInfo: { label: 'Thông tin cá nhân', emoji: '👤', required: true },
  summary: { label: 'Mục tiêu / Giới thiệu', emoji: '📝' },
  experience: { label: 'Kinh nghiệm làm việc', emoji: '💼' },
  education: { label: 'Học vấn', emoji: '🎓' },
  skills: { label: 'Kỹ năng', emoji: '⚡' },
  projects: { label: 'Dự án', emoji: '🚀' },
  certificates: { label: 'Chứng chỉ', emoji: '📜' },
  activities: { label: 'Hoạt động ngoại khóa', emoji: '🏆' },
  interests: { label: 'Sở thích', emoji: '❤️' },
  languages: { label: 'Ngoại ngữ', emoji: '🌏' },
};

function SortableSection({
  section, visible, onToggle,
}: {
  section: CVSection; visible: boolean; onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section });
  const info = SECTION_INFO[section];

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        background: visible ? 'var(--bg-card)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: '10px',
        cursor: 'default',
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: 'var(--text-muted)', flexShrink: 0, touchAction: 'none' }}
      >
        <GripVertical size={16} />
      </div>

      <span style={{ fontSize: '1.1rem' }}>{info.emoji}</span>

      <p style={{
        flex: 1,
        fontWeight: 600,
        fontSize: '0.88rem',
        color: visible ? 'var(--text-primary)' : 'var(--text-muted)',
        textDecoration: visible ? 'none' : 'line-through',
      }}>
        {info.label}
        {info.required && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>(bắt buộc)</span>}
      </p>

      <button
        onClick={onToggle}
        disabled={info.required}
        title={visible ? 'Ẩn mục này' : 'Hiện mục này'}
        style={{
          background: visible ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.05)',
          border: 'none',
          borderRadius: '8px',
          padding: '6px',
          cursor: info.required ? 'not-allowed' : 'pointer',
          color: visible ? 'var(--primary)' : 'var(--text-muted)',
          flexShrink: 0,
          opacity: info.required ? 0.4 : 1,
        }}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>
  );
}

interface Props {
  order: CVSection[];
  visibility: Partial<Record<CVSection, boolean>>;
  onReorder: (newOrder: CVSection[]) => void;
  onToggle: (section: CVSection) => void;
}

export default function SectionsPanel({ order, visibility, onReorder, onToggle }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as CVSection);
      const newIndex = order.indexOf(over.id as CVSection);
      onReorder(arrayMove(order, oldIndex, newIndex));
    }
  };

  return (
    <div>
      <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', marginBottom: '4px' }}>🖱️ Kéo để sắp xếp thứ tự</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Giữ và kéo từng mục để thay đổi thứ tự xuất hiện trong CV. Nhấn icon mắt để bật/tắt hiện.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {order.map(section => (
              <SortableSection
                key={section}
                section={section}
                visible={visibility[section] !== false}
                onToggle={() => onToggle(section)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
