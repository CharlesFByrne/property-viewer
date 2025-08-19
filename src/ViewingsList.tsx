//ViewingsList.tsx
import React, { useEffect, useState } from "react";
import { Viewing, Lead } from "./types";
import { printDateTime } from "./utils";
import axios from "axios";
import "./App.css";
import "./table.css";
import editGif from "./assets/edit.gif";
import deleteGif from "./assets/delete.gif";
import DeleteModal from "./DeleteModal";
import InviteModal from "./InviteModal";
import { useConfigContext } from "./ConfigContext";

const DEFAULT_MAX_ATTENDEES = 5;

interface EditableViewing extends Viewing {
  isNew?: boolean; // optional, only used in the UI
}

interface ViewingsListProps {
  viewings: Viewing[];
  setViewings: React.Dispatch<React.SetStateAction<Viewing[]>>;
  leads: Lead[];
}

const EditButton: React.FC<DeleteButtonProps> = ({ onClick }) => {
  return (
    <button className="edit-btn" onClick={onClick}>
      <img src={editGif} alt="Edit" className="edit-gif" />
    </button>
  );
};

interface DeleteButtonProps {
  onClick: () => void;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick }) => {
  return (
    <button className="edit-btn" onClick={onClick}>
      <img src={deleteGif} alt="Delete" className="edit-gif" />
    </button>
  );
};

const ViewingsList: React.FC<ViewingsListProps> = ({
  viewings,
  setViewings,
  leads,
}) => {
  const config = useConfigContext();

  const [selectedToDelete, setSelectedToDelete] = useState<Viewing>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingViewingID, setEditingViewingID] = useState<string | null>(null);
  const [inEditingMode, setInEditingMode] = useState(false);

  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  type FormData = {
    name: string;
    location: string;
    date_and_time: string;
    max_attendees: number;
    attending: number;
  };

  const handleInvite = (viewing: Viewing) => {
    setSelectedViewing(viewing);
    setIsModalOpen(true);
  };

  const renderInviteButton = (viewingDateTime: string, viewing: Viewing) => {
    const now = new Date();
    const viewingDate = new Date(viewingDateTime);

    if (viewingDate > now) {
      return (
        <button
          onClick={() => handleInvite(viewing)}
          className="smaller_button"
        >
          Invite
        </button>
      );
    }
    return null;
  };

  const clearFormData = () => {
    setFormData({
      name: "",
      location: "",
      date_and_time: "",
      max_attendees: DEFAULT_MAX_ATTENDEES,
      attending: 0,
    });
  };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    location: "",
    date_and_time: "",
    max_attendees: DEFAULT_MAX_ATTENDEES,
    attending: 0,
  });

  const [backupViewing, setBackupViewing] = useState<Viewing | null>(null);

  const startEditing = (viewing: Viewing) => {
    function formatDateForInput(dateString: string) {
      const date = new Date(dateString);

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    if (inEditingMode) {
      console.log("CANCEL 125");
      cancelEditing();
    }
    setErrors({});
    setInEditingMode(true);
    setEditingViewingID(viewing.id!);
    setBackupViewing({ ...viewing }); // save original in case rollback needed
    setFormData({
      name: viewing.name,
      location: viewing.location,
      date_and_time: formatDateForInput(viewing.date_and_time),
      max_attendees: viewing.max_attendees,
      attending: viewing.attending,
    });
  };

  type Errors = Partial<Record<keyof FormData, string>>;

  const [errors, setErrors] = useState<Errors>({});

  const cancelEditing = () => {
    console.log("cancelEditing", editingViewingID, backupViewing);
    let wasNewInsert = editingViewingID === null;

    if (wasNewInsert) {
      // Remove temporary new row
      setViewings((prev) => prev.filter((viewing) => viewing.id !== null));
    } else if (backupViewing) {
      // Restore original lead
      setViewings((prev) =>
        prev.map((l) =>
          l.id === backupViewing.id ? { ...backupViewing, isEditing: false } : l
        )
      );
      setEditingViewingID(null);
    }
    setBackupViewing(null);
    setInEditingMode(false);
    clearFormData();
  };

  function validate() {
    const newErrors: Errors = {};
    if (!(formData?.name ?? "").trim())
      newErrors.name = "Please enter a property name";
    if (!(formData?.location ?? "").trim())
      newErrors.location = "Please enter a property location";
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
    if (formData.max_attendees < 1)
      newErrors.max_attendees = "There must be at least one attendee";
    return newErrors;
  }

  const addNewLeadRow = () => {
    if (inEditingMode) return;
    setErrors({});
    const newViewing: EditableViewing = {
      id: null, // no id yet
      name: "",
      location: "",
      date_and_time: "",
      max_attendees: DEFAULT_MAX_ATTENDEES,
      attending: 0,
      isNew: true, // mark as new
    };

    setViewings((prev) => [newViewing, ...prev]); // insert at top
    setEditingViewingID(null); // optional
    setFormData(newViewing); // preload the formData
    setInEditingMode(true);
  };

  const saveEdit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let isNewViewing = editingViewingID === null;
    let job = isNewViewing ? "add" : "edit",
      viewing = {
        id: editingViewingID,
        name: formData.name,
        location: formData.location,
        date_and_time: formData.date_and_time,
        max_attendees: formData.max_attendees,
        attending: formData.attending,
      };

    const index = isNewViewing
      ? 0
      : viewings.findIndex((item) => item.id === editingViewingID);
    console.log("INDEX", index);
    if (index != -1) {
      let { ENDPOINT } = config;
      try {
        const res = await axios.post(
          `${ENDPOINT}/viewings/${job}`,
          { viewing },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`${job}ing lead result:`, res.data, res.data);
        let id: string | null;
        if (isNewViewing) {
          id = res.data.new_id;
          console.log("id", id);
        } else {
          id = editingViewingID;
        }
        setViewings((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...formData,
            id, // set new id
          };
          return updated;
        });

        setInEditingMode(false);
      } catch (error) {
        console.error(`Error ${job}ing viewing`, error);
        // rollback to backup if available
        if (backupViewing) {
          setViewings((prev) =>
            prev.map((l) => (l.id === backupViewing.id ? backupViewing : l))
          );
        }
      }
    }
    setEditingViewingID(null);
    clearFormData();
  };

  useEffect(() => {
    if (!inEditingMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("CANCEL 286");
        cancelEditing();
      }
      if (e.key === "Enter") {
        saveEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [inEditingMode]);

  const handleDeleteIconClick = (viewing: Viewing) => {
    setSelectedToDelete(viewing);
    setIsDeleteModalOpen(true);
  };

  return (
    <div>
      <span className="compactForm button-wrapper">
        <button
          type="submit"
          className="add-viewing-btn"
          onClick={addNewLeadRow}
        >
          Add Viewing
        </button>
      </span>
      <table className="viewings-table">
        <thead>
          <tr>
            <th style={{ width: "300px" }}>Property Name & Location</th>
            <th style={{ width: "150px" }}>Date & Time</th>
            <th style={{ width: "20px" }}>Max Attendees</th>
            <th style={{ width: "20px" }}>Attending</th>
            <th style={{ width: "30px" }}></th>
            <th style={{ width: "120px" }}></th>
            <th style={{ width: "20px" }}></th>
          </tr>
        </thead>
        <tbody>
          {viewings.map((viewing, index) => {
            const isEditing = editingViewingID === viewing.id;

            return (
              <tr key={viewing.id} className={index % 2 === 0 ? "even" : "odd"}>
                <td>
                  {isEditing ? (
                    <div
                      className="input-wrapper"
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <input
                        style={{ width: "100%" }}
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Property Name"
                        autoComplete="off"
                      />
                      {errors.name && (
                        <span className="error-float error-bottom">
                          {errors.name}
                        </span>
                      )}
                    </div>
                  ) : (
                    `${viewing.name}, `
                  )}{" "}
                  {isEditing ? (
                    <div
                      className="input-wrapper"
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <input
                        style={{ width: "100%" }}
                        value={formData.location || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Location"
                        autoComplete="off"
                      />
                      {errors.location && (
                        <span className="error-float error-bottom">
                          {errors.location}
                        </span>
                      )}
                    </div>
                  ) : (
                    viewing.location
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <div
                      className="input-wrapper"
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <input
                        name="date_and_time"
                        type="datetime-local"
                        value={formData.date_and_time || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date_and_time: e.target.value,
                          }))
                        }
                        // min={new Date().toISOString().slice(0,16)}
                        placeholder="Date and Time"
                        autoComplete="off"
                      />
                      {errors.date_and_time && (
                        <span className="error-float error-bottom">
                          {errors.date_and_time}
                        </span>
                      )}
                    </div>
                  ) : (
                    printDateTime(viewing.date_and_time)
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <div
                      className="input-wrapper"
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <input
                        value={formData.max_attendees || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            max_attendees: parseInt(e.target.value),
                          }))
                        }
                        placeholder="Max Attendees"
                        autoComplete="off"
                      />
                      {errors.max_attendees && (
                        <span className="error-float error-bottom">
                          {errors.max_attendees}
                        </span>
                      )}
                    </div>
                  ) : (
                    viewing.max_attendees
                  )}
                </td>
                <td>{viewing.attending}</td>
                <td>{renderInviteButton(viewing.date_and_time, viewing)}</td>
                <td style={{ textAlign: "right" }}>
                  {isEditing ? (
                    <span style={{ display: "inline-block" }}>
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={cancelEditing}>Cancel</button>
                    </span>
                  ) : (
                    <span style={{ display: "inline-block" }}>
                      <EditButton onClick={() => startEditing(viewing)} />
                    </span>
                  )}
                </td>

                <td>
                  <DeleteButton
                    onClick={() => handleDeleteIconClick(viewing)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewing={selectedViewing}
        leads={leads}
      />
      {selectedToDelete && (
        <DeleteModal
          leadOrViewing={"viewing"}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          targetID={selectedToDelete.id!}
          listToDeleteFrom={viewings}
          setListToDeleteFrom={setViewings}
        />
      )}
    </div>
  );
};

export default ViewingsList;
