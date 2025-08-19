import React, { useState } from "react";
import axios from "axios";
import { Lead } from "./types";
import "./App.css";

interface LeadsListProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const LeadsForm: React.FC<LeadsListProps> = ({ leads, setLeads }) => {
  const [formData, setFormData] = useState({
    id: null,
    first_name: "",
    last_name: "",
    email: "",
  });

  type FormData = {
    first_name: string;
    last_name: string;
    email: string;
  };
  type Errors = Partial<Record<keyof FormData, string>>;
  const [errors, setErrors] = useState<Errors>({});

  const updateLeads = (newLead: Lead) => {
    const new_leads = [newLead, ...leads];
    setLeads(new_leads);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  function validate() {
    const newErrors: Errors = {};
    if (!formData.first_name.trim()) {
      newErrors.first_name = "Please enter your first name";
    }
    if (!formData.last_name.trim())
      newErrors.last_name = "Please enter your last name";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    return newErrors;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      try {
        setErrors({});
        const _formData = formData;
        let new_lead = { new_lead: formData };
        const res = await axios.post(
          "http://localhost:5000/api/leads/add",
          new_lead
        );
        console.log("NEW VIEWING res:", res.data);
        updateLeads(formData);
        //      fetchLeads(); // ✅ Refresh list from backend after adding
        setFormData({ id: null, first_name: "", last_name: "", email: "" });
      } catch (error) {
        console.error("Error adding lead:", error);
      }
    }
  };

  return (
    <div>
      <h1>Property Leads</h1>
      <form onSubmit={handleSubmit}>
        <span className="compactForm">
          <span className="input-wrapper">
            <input
              name="first_name"
              placeholder="First Name"
              value={formData.first_name}
              autoComplete="off"
              onChange={handleChange}
            />
          </span>
          {errors.first_name && (
            <span className="error-float error-bottom">
              {errors.first_name}
            </span>
          )}
        </span>
        <span className="compactForm">
          <span className="input-wrapper">
            <input
              name="last_name"
              placeholder="Last Name"
              value={formData.last_name}
              autoComplete="off"
              onChange={handleChange}
            />
          </span>
          {errors.last_name && (
            <span className="error-float error-bottom">{errors.last_name}</span>
          )}
        </span>
        <span className="compactForm">
          <span className="input-wrapper">
            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              autoComplete="off"
              onChange={handleChange}
            />
          </span>
          {errors.email && (
            <span className="error-float error-bottom">{errors.email}</span>
          )}
        </span>
        <span className="compactForm button-wrapper">
          <button type="submit" className="add-viewing-btn">
            Add Lead
          </button>
        </span>
      </form>
    </div>
  );
};

export default LeadsForm;
