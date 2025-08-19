// ViewingsList.tsx
import React, { useState } from "react";
import { Viewing, Lead } from "./types";
import ViewingsForm from "./ViewingsForm";
import InviteModal from "./InviteModal";
import { printDateTime } from "./utils";
import "./App.css";
import "./table.css";

interface ViewingsListProps {
  viewings: Viewing[];
  setViewings: React.Dispatch<React.SetStateAction<Viewing[]>>;
  leads: Lead[];
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewing: Viewing | null;
}

const ViewingsList: React.FC<ViewingsListProps> = ({
  viewings,
  setViewings,
  leads,
}) => {
  const [selectedViewing, setSelectedViewing] = useState<Viewing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const handleInvite = (index: number) => {
  //     console.log(`Invite sent for viewing index: ${index}`);
  // };

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

  return (
    <div>
      <ViewingsForm viewings={viewings} setViewings={setViewings} />

      <table className="viewings-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Date & Time</th>
            <th>Max Attendees</th>
            <th>Attending</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {viewings.map((v, index) => (
            <tr key={v.id} className={index % 2 === 0 ? "even" : "odd"}>
              <td>{v.name}</td>
              <td>{v.location}</td>
              <td>{printDateTime(v.date_and_time)}</td>
              <td>{v.max_attendees}</td>
              <td>{v.attending}</td>
              <td>{renderInviteButton(v.date_and_time, v)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewing={selectedViewing}
        leads={leads}
      />
    </div>
  );
};

export default ViewingsList;
