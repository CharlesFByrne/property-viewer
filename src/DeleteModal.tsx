import React, { useState, useEffect } from "react";
import { Viewing, Lead, InviteStatus } from "./types";
import { printDateTime } from "./utils";
import axios from "axios";
import "./App.css";

// Types for each mode (no generics)
type LeadDeleteModalProps = {
  leadOrViewing: "lead";
  isOpen: boolean;
  onClose: () => void;
  targetID: string; // required
  listToDeleteFrom: Lead[];
  setListToDeleteFrom: React.Dispatch<React.SetStateAction<Lead[]>>;
};

type ViewingDeleteModalProps = {
  leadOrViewing: "viewing";
  isOpen: boolean;
  onClose: () => void;
  targetID: string; // required
  listToDeleteFrom: Viewing[];
  setListToDeleteFrom: React.Dispatch<React.SetStateAction<Viewing[]>>;
};

type DeleteModalProps = LeadDeleteModalProps | ViewingDeleteModalProps;

const DeleteModal: React.FC<DeleteModalProps> = (props) => {
  const { leadOrViewing, isOpen, onClose, targetID } = props;
  if (!isOpen) return null;

  // Find the record safely even if id can be null
  let recordToDelete: Lead | Viewing | undefined;

  if (props.leadOrViewing === "lead") {
    recordToDelete = props.listToDeleteFrom.find(
      (item: Lead) => (item.id ?? "") === targetID
    );
  } else {
    recordToDelete = props.listToDeleteFrom.find(
      (item: Viewing) => (item.id ?? "") === targetID
    );
  }

  if (!recordToDelete) return null;

  const closeModal = () => onClose();

  const deleteItem = async () => {
    // Optimistic UI update (narrow by discriminant so setter type matches)
    if (leadOrViewing === "lead") {
      props.setListToDeleteFrom((prev) =>
        prev.filter((l) => (l.id ?? "") !== targetID)
      );
    } else {
      props.setListToDeleteFrom((prev) =>
        prev.filter((v) => (v.id ?? "") !== targetID)
      );
    }

    try {
      const endpoint = leadOrViewing === "lead" ? "leads" : "viewings";
      console.log(`http://localhost:5000/api/${endpoint}/delete`, targetID);
      await axios.post(
        `http://localhost:5000/api/${endpoint}/delete`,
        { id: targetID },
        { headers: { "Content-Type": "application/json" } }
      );
      closeModal();
    } catch (err) {
      console.error("Error deleting Record", err);
      // Rollback on failure
      if (leadOrViewing === "lead") {
        props.setListToDeleteFrom((prev) => {
          const removed = (props.listToDeleteFrom as Lead[]).find(
            (l) => (l.id ?? "") === targetID
          );
          return removed ? [...prev, removed] : prev;
        });
      } else {
        props.setListToDeleteFrom((prev) => {
          const removed = (props.listToDeleteFrom as Viewing[]).find(
            (v) => (v.id ?? "") === targetID
          );
          return removed ? [...prev, removed] : prev;
        });
      }
    }
  };

  // Build description based on discriminant
  const [title, subtitle] =
    leadOrViewing === "lead"
      ? [
          `${(recordToDelete as Lead).first_name} ${
            (recordToDelete as Lead).last_name
          }`,
          `${(recordToDelete as Lead).email}`,
        ]
      : [
          `${(recordToDelete as Viewing).name}, ${
            (recordToDelete as Viewing).location
          }`,
          `${printDateTime((recordToDelete as Viewing).date_and_time)}`,
        ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content smaller-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <p>
          <strong>Are you sure you want to delete this {leadOrViewing}?</strong>
        </p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button className="close-btn" onClick={closeModal}>
            No, Cancel
          </button>
          <button className="send-btn" onClick={deleteItem}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
