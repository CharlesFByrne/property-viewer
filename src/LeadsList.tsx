// LeadsList.tsx
import React, { useEffect, useState } from "react";
import { Lead, Invite, InviteStatus } from "./types";
import axios from "axios";
import { useConfigContext } from "./ConfigContext";
import editGif from "./assets/edit.gif";
import deleteGif from "./assets/delete.gif";
import DeleteModal from "./DeleteModal";
import "./App.css";
import "./table.css";

interface EditableLead extends Lead {
  isNew?: boolean; // optional, only used in the UI
}

interface LeadsListProps {
  leads: Lead[];
  forSelection?: boolean;
  viewingID?: string;
  selectedRows?: string[];
  setSelectedRows?: React.Dispatch<React.SetStateAction<string[]>>;
  invites?: InviteStatus[];
  setInvites?: React.Dispatch<React.SetStateAction<InviteStatus[]>>;
  fetchInvites?: (viewing_id: string) => Promise<void>;
  setLeads?: React.Dispatch<React.SetStateAction<Lead[]>>;
  closeModal?: () => void;
  fullUp?: boolean;
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

const LeadsList: React.FC<LeadsListProps> = ({
  leads,
  forSelection = false,
  viewingID = "",
  selectedRows = [],
  setSelectedRows = () => {},
  invites = [],
  setInvites = () => {},
  fetchInvites = () => {},
  closeModal = () => {},
  setLeads = () => {},
  fullUp = false,
}) => {
  const config = useConfigContext();
  const [selectedToDelete, setSelectedToDelete] = useState<Lead>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingLeadID, setEditingLeadID] = useState<string | null>(null);
  const [inEditingMode, setInEditingMode] = useState(false);
  // const [editForm, setEditForm] = useState<Partial<Lead>>({});

  type FormData = {
    first_name: string;
    last_name: string;
    email: string;
  };

  const clearFormData = () => {
    setFormData({ first_name: "", last_name: "", email: "" });
  };

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [backupLead, setBackupLead] = useState<Lead | null>(null);

  const startEditing = (lead: Lead) => {
    if (inEditingMode) {
      cancelEditing();
    }
    setErrors({});
    setInEditingMode(true);
    setEditingLeadID(lead.id!);
    setBackupLead({ ...lead }); // save original in case rollback needed
    setFormData({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
    });
  };

  type Errors = Partial<Record<keyof FormData, string>>;

  const [errors, setErrors] = useState<Errors>({});

  const cancelEditing = () => {
    console.log("cancelEditing", editingLeadID);
    let wasNewInsert = editingLeadID === null;

    if (wasNewInsert) {
      // Remove temporary new row
      setLeads((prev) => prev.filter((lead) => lead.id !== null));
    } else if (backupLead) {
      // Restore original lead
      setLeads((prev) =>
        prev.map((l) =>
          l.id === backupLead.id ? { ...backupLead, isEditing: false } : l
        )
      );
      setEditingLeadID(null);
    }
    setBackupLead(null);
    setInEditingMode(false);
    clearFormData();
  };

  function validate() {
    const newErrors: Errors = {};
    if (!(formData?.first_name ?? "").trim())
      newErrors.first_name = "Please enter a first name";
    if (!(formData?.last_name ?? "").trim())
      newErrors.last_name = "Please enter a last name";
    if (!/\S+@\S+\.\S+/.test(formData?.email ?? ""))
      newErrors.email = "Please enter a valid email";
    return newErrors;
  }

  const addNewLeadRow = () => {
    if (inEditingMode) return;
    setErrors({});
    const newLead: EditableLead = {
      id: null, // no id yet
      first_name: "",
      last_name: "",
      email: "",
      isNew: true, // mark as new
    };

    setLeads((prev) => [newLead, ...prev]); // insert at top
    setEditingLeadID(null); // optional
    setFormData(newLead); // preload the formData
    setInEditingMode(true);
  };

  const saveEdit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let isNewLead = editingLeadID === null;
    let job = isNewLead ? "add" : "edit",
      lead = {
        id: editingLeadID,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      };

    const index = isNewLead
      ? 0
      : leads.findIndex((lead) => lead.id === editingLeadID);

    if (index != -1) {
      let { ENDPOINT } = config;
      try {
        const res = await axios.post(
          `${ENDPOINT}/leads/${job}`,
          { lead },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`${job}ing lead result:`, res.data);
        let fieldToChange = formData;
        if (isNewLead) {
          let id = res.data.new_id;
          console.log("id", id);
          Object.assign(fieldToChange, { id });
        }
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === editingLeadID ? { ...lead, ...formData } : lead
          )
        );
        closeModal();
      } catch (error) {
        console.error(`Error ${job}ing lead`, error);
        // rollback to backup if available
        if (backupLead) {
          setLeads((prev) =>
            prev.map((l) => (l.id === backupLead.id ? backupLead : l))
          );
        }
      }
    }
    setEditingLeadID(null);
    clearFormData();
  };

  useEffect(() => {
    if (forSelection) {
      fetchInvites(viewingID);
    }
  }, []);

  useEffect(() => {
    if (!inEditingMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelEditing();
      }
      if (e.key === "Enter") {
        saveEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      // discard unsaved changes on unmount
      if (inEditingMode) {
        cancelEditing();
      }
    };
  }, [inEditingMode]);

  const handleDeleteIconClick = (lead: Lead) => {
    setSelectedToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleSelectRow = (id: string, invited: boolean = false) => {
    if (fullUp || invited) return;
    if (!forSelection) return;
    let add_or_remove = selectedRows.includes(id) ? "remove" : "add";
    //addOrRemoveInvite(id, add_or_remove)
    console.log("selectedRows", id, selectedRows);
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const openTestEmail = (lead_id: string, viewingID: string) => {
    closeModal();
    window.open(`/email-preview/${lead_id}/${viewingID}`, "_blank");
  };

  const hasInvited = invites.some((invite) => invite.status === "invited");
  const testButtonColor = fullUp ? "red" : "green";

  return (
    <div>
      {!forSelection && (
        <span className="compactForm button-wrapper">
          <button
            type="submit"
            className="add-viewing-btn"
            onClick={addNewLeadRow}
          >
            Add Lead
          </button>
        </span>
      )}
      <table className="viewings-table">
        <thead>
          <tr>
            <th>Name</th>
            <th style={{ width: "200px" }}>Email</th>
            {forSelection && <th>Status</th>}
            {forSelection && hasInvited && <th></th>}
            {!forSelection && <th style={{ width: "120px" }}></th>}
            {!forSelection && <th style={{ width: "20px" }}></th>}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => {
            const isEditing = editingLeadID === lead.id;
            const invite = invites.find((inv) => inv.lead_id === lead.id);
            const status = invite?.status;

            const rowClass = isEditing
              ? "editing"
              : invite
              ? "invited"
              : selectedRows.includes(lead.id!)
              ? "selected"
              : index % 2 === 0
              ? "even"
              : "odd";

            return (
              <tr
                key={lead.id}
                className={rowClass}
                onClick={() => {
                  if (!invite) {
                    // only clickable if not invited
                    handleSelectRow(lead.id!);
                  }
                }}
              >
                <td>
                  {isEditing ? (
                    <div
                      className="input-wrapper"
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <input
                        style={{ width: "100%" }}
                        value={formData.first_name || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                        placeholder="First Name"
                        autoComplete="off"
                      />
                      {errors.first_name && (
                        <span className="error-float error-bottom">
                          {errors.first_name}
                        </span>
                      )}
                    </div>
                  ) : (
                    lead.first_name
                  )}{" "}
                  {isEditing ? (
                    <div
                      className="input-wrapper"
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <input
                        style={{ width: "100%" }}
                        value={formData.last_name || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                        placeholder="Last Name"
                        autoComplete="off"
                      />
                      {errors.last_name && (
                        <span className="error-float error-bottom">
                          {errors.last_name}
                        </span>
                      )}
                    </div>
                  ) : (
                    lead.last_name
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <div
                      className="input-wrapper"
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <input
                        value={formData.email || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Email"
                        autoComplete="off"
                      />
                      {errors.email && (
                        <span className="error-float error-bottom">
                          {errors.email}
                        </span>
                      )}
                    </div>
                  ) : (
                    lead.email
                  )}
                </td>

                {forSelection && <td>{status}</td>}
                {forSelection && hasInvited && (
                  <td>
                    {" "}
                    {invite?.status === "invited" ? (
                      <button
                        className="smaller_button"
                        style={{ backgroundColor: testButtonColor }}
                        onClick={() => openTestEmail(lead.id!, viewingID)}
                      >
                        Test accept
                      </button>
                    ) : null}{" "}
                  </td>
                )}
                {!forSelection && (
                  <td style={{ textAlign: "right" }}>
                    {isEditing ? (
                      <span style={{ display: "inline-block" }}>
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={cancelEditing}>Cancel</button>
                      </span>
                    ) : (
                      <span style={{ display: "inline-block" }}>
                        <EditButton onClick={() => startEditing(lead)} />
                      </span>
                    )}
                  </td>
                )}

                {!forSelection && (
                  <td>
                    <DeleteButton onClick={() => handleDeleteIconClick(lead)} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {selectedToDelete && (
        <DeleteModal
          leadOrViewing={"lead"}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          targetID={selectedToDelete.id ?? ""}
          setListToDeleteFrom={setLeads}
          listToDeleteFrom={leads}
        />
      )}
    </div>
  );
};

export default LeadsList;
