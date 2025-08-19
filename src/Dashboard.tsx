import { useState, useEffect } from "react";
import axios from "axios";
import TopBar from "./TopBar";
import ViewingsList from "./ViewingsList";
import LeadsList from "./LeadsList";
import { Viewing, Lead, AppConfig } from "./types";
import { useConfigContext } from "./ConfigContext";

interface InviteModalProps {
  config: AppConfig | null;
}

function App() {
  const config = useConfigContext();
  const { ENDPOINT } = config;
  const [currentPage, setCurrentPage] = useState<"viewings" | "assign">(
    "viewings"
  );
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  interface TablesResponse {
    viewings: Viewing[];
    leads: Lead[]; // Make sure you have a Lead interface
  }

  const fetchTables = async () => {
    try {
      const res = await axios.post<TablesResponse>(
        `${ENDPOINT}/get_tables` // http://localhost:5000/api/get_tables"
      );
      console.log("res", res.data);
      setViewings(res.data.viewings);
      setLeads(res.data.leads);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  // ✅ Fetch data on first render
  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <div>
      <TopBar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {currentPage === "viewings" && (
        <ViewingsList
          viewings={viewings}
          setViewings={setViewings}
          leads={leads}
        />
      )}

      {currentPage === "assign" && (
        <div>
          <LeadsList leads={leads} setLeads={setLeads} />
        </div>
      )}
    </div>
  );
}

export default App;
