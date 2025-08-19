import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { printDateTime } from "./utils";
import { useConfigContext } from "./ConfigContext";

export default function EmailPreview() {
  const { leadID = "", viewingID = "" } = useParams<{
    leadID: string;
    viewingID: string;
  }>();

  interface Invitation {
    date_and_time: string;
    email: string;
    first_name: string;
    last_name: string;
    location: string;
    viewing_name: string;
  }

  const config = useConfigContext();
  const { ENDPOINT } = config;
  const [invite, setInvite] = useState<Invitation>();

  const fetchInvite = async (viewingID: string, leadID: string) => {
    const res = await axios.post(
      `${ENDPOINT}/invites/fetch_one`,
      { leadID, viewingID },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Result:`, res.data.invite);
    setInvite(res.data.invite);
  };

  useEffect(() => {
    fetchInvite(viewingID, leadID);
  }, []);

  useEffect(() => {
    console.log("invite updated:", invite);
  }, [invite]);

  const lead = {
    id: leadID,
    viewingID,
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
  };

  const viewing = {
    id: viewingID,
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg shadow bg-white">
      {invite ? (
        <div>
          <h1 className="text-xl font-bold mb-4">
            RE: Property at {invite.location}
          </h1>

          <p>
            Hi <strong>{invite.first_name}</strong>,
          </p>

          <p>
            Thank you for accepting our invitation to viewing{" "}
            {invite.viewing_name} at {invite.location} at{" "}
            {printDateTime(invite.date_and_time, true)}. Please confirm by
            clicking the link below:
          </p>

          <p>
            <a
              href={`/confirm-invite/${lead.id}/${viewing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Confirm Invitation
            </a>
          </p>

          <p>
            Best regards,
            <br />
            Your Property Team
          </p>
        </div>
      ) : (
        "Loading invite email..."
      )}
    </div>
  );
}
