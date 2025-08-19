import { useState } from "react";
import { Viewing } from "./types";

interface AssignViewersProps {
  viewings: Viewing[];
  setViewings: (v: Viewing[]) => void;
}

export default function AssignViewers({
  viewings,
  setViewings,
}: AssignViewersProps) {
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    location: "",
    date_and_time: "",
    max_attendees: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {};

  return (
    <div style={{ padding: "20px" }}>
      <h2>Assign Viewers / Add Viewing</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <input
          name="date_and_time"
          type="datetime-local"
          value={formData.date_and_time}
          onChange={handleChange}
          required
        />
        <input
          name="max_attendees"
          type="number"
          min={1}
          value={formData.max_attendees}
          onChange={handleChange}
        />
        <button type="submit">Add Viewing</button>
      </form>
    </div>
  );
}
