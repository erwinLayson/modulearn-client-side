import { useState, useMemo, type ChangeEvent } from "react";
import type { ScheduleItem } from "../api/classes";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function SchedulePicker({
  value,
  onChange,
}: {
  value: ScheduleItem[];
  onChange: (schedule: ScheduleItem[]) => void;
}) {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});

  const safeValue: ScheduleItem[] = Array.isArray(value) ? value : [];

  const scheduleByDay = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    DAYS.forEach(d => map[d] = []);
    safeValue.forEach(item => {
      if (map[item.day]) map[item.day].push(item);
    });
    return map;
  }, [safeValue]);

  const handleAddSlot = (day: string) => {
    setEditingDay(day);
    setEditForm({ day, start_time: "08:00", end_time: "09:30", room: "" });
  };

  const handleEditSlot = (slot: ScheduleItem) => {
    setEditingDay(slot.day);
    setEditForm({ ...slot });
  };

  const handleSaveSlot = () => {
    if (!editingDay) return;
    const newSchedule = [...safeValue];
    const index = newSchedule.findIndex(s => s.day === editingDay && s.start_time === editForm.start_time && s.end_time === editForm.end_time);
    const slot: ScheduleItem = {
      day: editingDay,
      start_time: editForm.start_time!,
      end_time: editForm.end_time!,
      room: editForm.room || undefined,
    };
    if (index >= 0) {
      newSchedule[index] = slot;
    } else {
      newSchedule.push(slot);
    }
    onChange(newSchedule);
    setEditingDay(null);
    setEditForm({});
  };

  const handleRemoveSlot = (slot: ScheduleItem) => {
    onChange(safeValue.filter(s => !(s.day === slot.day && s.start_time === slot.start_time && s.end_time === slot.end_time)));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditForm((prev: Partial<ScheduleItem>) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="schedule-picker">
      <div className="schedule-picker-grid">
        {DAYS.map(day => {
          const slots = scheduleByDay[day];
          return (
            <div key={day} className="schedule-picker-day">
              <div className="schedule-picker-day-header">
                <span className="schedule-picker-day-label">{day}</span>
                <span className="schedule-picker-day-count">{slots.length}</span>
              </div>
              <div className="schedule-picker-slots">
                {slots.map((slot, idx) => (
                  <div key={idx} className="schedule-picker-slot">
                    <span className="schedule-picker-slot-time">
                      {slot.start_time} - {slot.end_time}
                    </span>
                    {slot.room && (
                      <span className="schedule-picker-slot-room">{slot.room}</span>
                    )}
                    <div className="schedule-picker-slot-actions">
                      <button
                        type="button"
                        className="schedule-picker-btn schedule-picker-btn--edit"
                        onClick={() => handleEditSlot(slot)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="schedule-picker-btn schedule-picker-btn--delete"
                        onClick={() => handleRemoveSlot(slot)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {!editingDay || editingDay !== day ? (
                  <button
                    type="button"
                    className="schedule-picker-add-btn"
                    onClick={() => handleAddSlot(day)}
                  >
                    + Add Slot
                  </button>
                ) : (
                  <div className="schedule-picker-edit-form">
                    <input
                      type="time"
                      name="start_time"
                      value={editForm.start_time || "08:00"}
                      onChange={handleInputChange}
                      className="schedule-picker-input"
                    />
                    <span>–</span>
                    <input
                      type="time"
                      name="end_time"
                      value={editForm.end_time || "09:30"}
                      onChange={handleInputChange}
                      className="schedule-picker-input"
                    />
                    <input
                      type="text"
                      name="room"
                      placeholder="Room (optional)"
                      value={editForm.room || ""}
                      onChange={handleInputChange}
                      className="schedule-picker-input schedule-picker-input--room"
                    />
                    <div className="schedule-picker-edit-actions">
                      <button
                        type="button"
                        className="schedule-picker-btn schedule-picker-btn--save"
                        onClick={handleSaveSlot}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="schedule-picker-btn schedule-picker-btn--cancel"
                        onClick={() => { setEditingDay(null); setEditForm({}); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {safeValue.length === 0 && (
        <p className="schedule-picker-empty">No schedule set. Click "+ Add Slot" on any day to add a time slot.</p>
      )}
    </div>
  );
}