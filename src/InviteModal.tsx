import React, { useState, useEffect } from "react";
import { Viewing, Lead, InviteStatus } from "./types";
import axios from "axios";
import LeadsList from "./LeadsList";
import { useConfigContext } from "./ConfigContext";
import "./App.css";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewing: Viewing | null;
  leads: Lead[];
}

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  viewing,
  leads,
}) => {
  const config = useConfigContext();
  const { ENDPOINT } = config;
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [leadsToEmail, setLeadsToEmail] = useState<string[]>([]);
  const [invites, setInvites] = useState<InviteStatus[]>([]);

  const fetchInvites = async (viewing_id: string) => {
    try {
      const res = await axios.post(
        `${ENDPOINT}/invites/fetch`,
        { viewing_id },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("get_invites res", res.data);
      setInvites(res.data.invites);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    const _leadsToEmail: string[] = invites
      .filter((invite) => invite.status === "send_email")
      .map((invite) => invite.lead_id);

    setLeadsToEmail(_leadsToEmail);
  }, [invites]); // <-- run whenever invites changes

  if (!isOpen || !viewing) return null;

  const closeModal = () => {
    setSelectedRows([]);
    onClose();
  };

  const markInvites = async () => {
    console.log("selectedRows", selectedRows);
    let leadIDs = selectedRows;
    try {
      const res = await axios.post(`${ENDPOINT}/invites/mark`, {
        leadIDs,
        viewing_id: viewing.id,
      });
      setSelectedRows([]);
      console.log("Invites sent:", res.data);
      // Refresh invites here
      setInvites(res.data.invites);
    } catch (err) {
      console.error("Error sending invites:", err);
    }
  };

  const sendEmails = async () => {
    console.log("selectedRows", selectedRows);
    let leadIDs = leadsToEmail;
    try {
      const res = await axios.post(`${ENDPOINT}/invites/email`, {
        leadIDs,
        viewing_id: viewing.id,
      });
      setSelectedRows([]);
      console.log("Invites sent:", res.data);
      // Refresh invites here
      setInvites(res.data.invites);
    } catch (err) {
      console.error("Error sending invites:", err);
    }
  };

  const fullUp = viewing.attending >= viewing.max_attendees;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Invite to: {viewing.name}</h2>
        <p>
          <strong>Location:</strong> {viewing.location}
        </p>
        <p>
          <strong>Date:</strong>{" "}
          {new Date(viewing.date_and_time).toLocaleString()}
        </p>
        <p>
          <strong>Attending:</strong> {viewing.attending} of{" "}
          {viewing.max_attendees}
          {fullUp && (
            <span style={{ color: "red" }}> This viewing is full.</span>
          )}
        </p>
        {!fullUp && <p>Click Lead to select...</p>}

        <div className="leads-wrapper">
          <LeadsList
            leads={leads}
            forSelection={true}
            viewingID={viewing.id!}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            invites={invites}
            setInvites={setInvites}
            fetchInvites={fetchInvites}
            closeModal={closeModal}
            fullUp={fullUp}
          />
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button className="close-btn" onClick={closeModal}>
            Close
          </button>
          {!fullUp && (
            <span>
              <button
                className="send-btn"
                onClick={markInvites}
                disabled={selectedRows.length === 0}
                title={
                  selectedRows.length === 0 ? "Select at least one lead" : ""
                }
              >
                Mark Invite{selectedRows.length > 1 && "s"}
              </button>
              <button
                className="send-btn"
                onClick={sendEmails}
                disabled={leadsToEmail.length === 0}
                title={leadsToEmail.length === 0 ? "Send email invites" : ""}
              >
                Send Email{leadsToEmail.length > 1 && "s"}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
