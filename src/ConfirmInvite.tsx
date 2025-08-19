import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ConfirmInvite() {
  const { leadID, viewingID } = useParams<{
    leadID: string;
    viewingID: string;
  }>();
  const [status, setStatus] = useState<
    "loading" | "success" | "already_accepted" | "full" | "error"
  >("loading");

  useEffect(() => {
    async function confirm() {
      try {
        const res = await axios.post(
          `http://localhost:5000/api/invites/confirm/${leadID}/${viewingID}`,
          {
            method: "POST",
          }
        );
        let { success, status = null } = res.data;

        console.log("res.data", res.data);
        if (res.data.error) throw new Error("Failed to confirm");
        setStatus(status);
      } catch {
        setStatus("error");
      }
    }
    confirm();
  }, [leadID]);

  return (
    <div className="max-w-lg mx-auto mt-20 p-6 border rounded-lg shadow bg-white text-center">
      {status === "loading" && (
        <p>Confirming your invitation ${viewingID}...</p>
      )}
      {status === "success" && (
        <p className="text-green-600">Your invitation has been confirmed ✅</p>
      )}
      {status === "already_accepted" && (
        <p className="text-green-600">
          You have already accepted this invitation.
        </p>
      )}
      {status === "full" && (
        <p className="text-red-600">
          Unfortunately all the spaces have been filled for this time slot.
          Please contact us to arrange a different viewing.
        </p>
      )}
      {status === "error" && (
        <p className="text-red-600">Something went wrong ❌</p>
      )}
    </div>
  );
}
