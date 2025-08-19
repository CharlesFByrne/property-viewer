import React, { useState } from 'react';
import axios from 'axios';
import { Viewing } from './types';
import './App.css';


const DEFAULT_MAX_ATTENDEES = 5;

interface ViewingsListProps {
  viewings: Viewing[];
  setViewings: React.Dispatch<React.SetStateAction<Viewing[]>>;
}    

const ViewingsForm: React.FC<ViewingsListProps> = ({ viewings, setViewings }) => {

//   const [viewings, setViewings] = useState<Viewing[]>([]);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    location: '',
    date_and_time: '',
    max_attendees: DEFAULT_MAX_ATTENDEES,
    attending: 0
  });

type FormData = {
  name: string;
  location: string;
  date_and_time: string;  
  max_attendees: number;
};  
  type Errors = Partial<Record<keyof FormData, string>>;
  const [errors, setErrors] = useState<Errors>({});  

  const updateViewings = (newViewing: Viewing) => {

    const new_viewings = [newViewing, ...viewings];
    setViewings(new_viewings);
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

function validate() {
  const newErrors: Errors = {};
  if (!formData.name.trim()) newErrors.name = "Please the property name";
  if (!formData.location.trim()) newErrors.location = "Please enter the property address";
  if (!formData.date_and_time) {
    newErrors.date_and_time = "Please select a date and time";
  } else {
    const selected = new Date(formData.date_and_time);
    const now = new Date();

    if (isNaN(selected.getTime())) {
      newErrors.date_and_time = "Invalid date format";
    } else if (selected <= now) {
      newErrors.date_and_time = "Viewing time must be in the future";
    }
  }
  if (formData.max_attendees < 1) newErrors.max_attendees = "There must be at least one attendee";
  return newErrors;
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
      } else {
        try {
          const _formData = formData;
          let new_viewing = { new_viewing: formData };
          const res = await axios.post('http://localhost:5000/api/add_viewing', new_viewing);
          console.log('NEW VIEWING res:', res.data);
          updateViewings(formData);
    //      fetchViewings(); // ✅ Refresh list from backend after adding
          setFormData({ id: null, name: '', location: '', date_and_time: '', max_attendees: DEFAULT_MAX_ATTENDEES, attending: 0 });
        } catch (error) {
          console.error('Error adding viewing:', error);
        }
      }
  };

  return (
    <div>
      <h1>Property Viewings</h1>

      <form onSubmit={handleSubmit}>
      <span className="compactForm">
        <span className="input-wrapper">
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="off"          
        />
        </span>
        {errors.name && <span className="error-float error-bottom">{errors.name}</span>}
      </span>
      <span className="compactForm">
        <span className="input-wrapper">
        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          autoComplete="off"          
        />
        </span>
        {errors.location && <span className="error-float error-bottom">{errors.location}</span>}
      </span>
      <span className="compactForm">
        <span className="input-wrapper">
        <input 
          name="date_and_time"
          type="datetime-local"
          value={formData.date_and_time}
          // min={new Date().toISOString().slice(0,16)} 
          onChange={handleChange}
        />
        </span>
        {errors.date_and_time && <span className="error-float error-bottom">{errors.date_and_time}</span>}        
      </span>
      <span className="compactForm">
        <span className="input-wrapper">
        <input
          name="max_attendees"
          placeholder="Max Attendees"
          value={formData.max_attendees}
          onChange={handleChange}
        />
        </span>
        {errors.max_attendees && <span className="error-float error-bottom">{errors.max_attendees}</span>}        
      </span>      
      <span className="compactForm button-wrapper">
        <button type="submit" className="add-viewing-btn">Add Viewing</button>
      </span>
      </form>

    </div>
  );
};

export default ViewingsForm;