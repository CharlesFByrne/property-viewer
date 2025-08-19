import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { compare, genSalt, hash } from "./encryption.js";
import { promises } from "fs";
import { init } from "./database.js";
import { createTransport } from "nodemailer";
import { colorPrint, printDateTime, generateUniqueID } from "./utils.js";

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VIEWINGS_TABLE = {
  name: "property_viewings",
  definition: [
    `id TEXT`,
    `name TEXT`,
    `location TEXT`,
    `date_and_time TIMESTAMP`,
    `max_attendees INT`,
    `attending INT DEFAULT 0`,
    "PRIMARY KEY (id)",
  ],
};
const LEADS_TABLE = {
  name: "property_leads",
  definition: [
    `id TEXT`,
    `first_name TEXT`,
    `last_name TEXT`,
    `email TEXT`,
    "PRIMARY KEY (id)",
  ],
};
const INVITES_TABLE = {
  name: "property_invites",
  definition: [
    // `id TEXT`,
    `viewing_id TEXT REFERENCES ${VIEWINGS_TABLE.name}(id) ON DELETE CASCADE`,
    `lead_id TEXT REFERENCES ${LEADS_TABLE.name}(id) ON DELETE CASCADE`,
    `status TEXT default 'send_email' CHECK (status IN (
        'send_email', 'invited', 'accepted', 'attended', 'did_not_show'
    ))`,
    "PRIMARY KEY (viewing_id, lead_id)",
  ],
};
const USERS_TABLE = {
  name: "users",
  definition: [`id TEXT`, `email TEXT`, `pw TEXT`],
};

let CONFIG = await loadSetupJSON("./setup.json");
await writeEndpointForFrontEnd();

const app = express();
let pool = await init(CONFIG.database);
await createTablesIfNeeded();

// ==================================================================

async function loadSetupJSON(CONFIG_PATH_AND_FILE) {
  try {
    const raw = await promises.readFile(CONFIG_PATH_AND_FILE, "utf-8");
    console.log(`✅ Loaded setup.json from: ${CONFIG_PATH_AND_FILE}`);
    return JSON.parse(raw);
  } catch (err) {
    console.warn(
      `⚠️  Failed to load from: ${CONFIG_PATH_AND_FILE} — ${err.code}`
    );
    console.error(err);
  }

  console.error(`❌ Could not find ${CONFIG_PATH_AND_FILE}.`);
  process.exit(1);
}

async function writeEndpointForFrontEnd() {
  const frontend_setup_JSON = `{
  "PORT": ${CONFIG.DEFAULT_PORT},
  "ENDPOINT": "${CONFIG.BACKEND_ENDPOINT}",
  "ENDPOINT_FOR_EMAIL": "${CONFIG.ENDPOINT_FOR_EMAIL}"
   }`;
  let FRONTEND_DIRECTORY = "../public";
  try {
    await promises.writeFile(
      `${FRONTEND_DIRECTORY}/setup.json`,
      frontend_setup_JSON
    );
    console.log("FRONTEND_DIRECTORY", FRONTEND_DIRECTORY);
    colorPrint("green", `${FRONTEND_DIRECTORY}'/setup.json' file written.`);
  } catch (err) {
    colorPrint("red", `${FRONTEND_DIRECTORY}'/setup.json' file not written.`);
  }
}

async function createTableIfNotExists(table) {
  try {
    const checkTableExists = await pool.query(
      `SELECT * FROM ${table.name} LIMIT 1;`
    );
    console.log(`${table.name} already exists`);
    return true;
  } catch (error) {
    console.log(`Creating table: "${table.name}".`);
    let definition_SQL = table.definition.join(",");
    const CREATE_SQL = `CREATE TABLE ${table.name} (${definition_SQL});`;
    colorPrint("yellow", `CREATE_SQL: ${CREATE_SQL}`);
    const createNewtable = await pool.query(CREATE_SQL);
    console.log(`Table '${table.name}' Created.`);
    return false;
  }
}

async function addTableRecord(tableName, columns) {
  if ((columns?.id ?? "") === "") columns.id = null;
  columns.id ??= generateUniqueID(); // this is a different way to index tables, based on the timestamp they are created and a random number
  let new_id = columns.id;

  let keys = Object.keys(columns);
  let data_to_insert = [];
  let placeholders = keys.map((key, i) => {
    data_to_insert.push(columns[key]);
    return `$${i + 1}`;
  });

  try {
    let insert_SQL = `
      INSERT into ${tableName} 
        (${keys.join(", ")}) 
        VALUES(${placeholders.join(", ")});
      `;
    const result = await pool.query(insert_SQL, data_to_insert);
    if (result.rowsCount === 0) {
      console.log("user not added");
      return res.status(404).json({ error: "Not added" });
    }
    console.log("ADDED");
    return { error: null, new_id };
  } catch (error) {
    console.error("DB error:", error);
    return { error, data: null };
  }
}

async function removeTableRecord(tableName, condition, condition_params = []) {
  let keys = Object.keys(columns);
  let data_to_insert = [];
  let placeholders = keys.map((key, i) => {
    data_to_insert.push(columns[key]);
    return `$${i + 1}`;
  });

  try {
    let delete_SQL = `

      DELETE FROM ${tableName} WHERE ${condition};

      `;
    const result = await pool.query(delete_SQL, condition_params);

    console.log("DELETED");
    return { error: null, success: true };
  } catch (error) {
    console.error("DB error:", error);
    return { error, success: false };
  }
}

async function asyncSendMail(settings, mailOptions) {
  return new Promise((resolve, reject) => {
    let transporter = createTransport(settings);

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Error:", error);
        resolve({ sent: false, details: error });
      } else {
        console.log("Email sent: ", info.response);
        resolve({ sent: true, details: info.response });
      }
    });
  });
}

async function getInvites(viewing_id) {
  let get_invites_SQL = `SELECT lead_id, status FROM ${INVITES_TABLE.name} where viewing_id = $1;`;
  try {
    const invites_result = await pool.query(get_invites_SQL, [viewing_id]);
    console.log("invites_result.rows", invites_result.rows.length);
    return { error: null, invites: invites_result.rows };
  } catch (err) {
    console.error("DB error:", err);
    return { error: err, invites: null };
  }
}

async function generateEmail(viewingID, leadID) {
  let res = await get_particular_invite(viewingID, leadID);
  let { invite = null, error = null } = res;
  // TO-DO: error checking if DB doesn't return;
  let subject = `RE: Property at ${invite.location}`;
  let body = `        <div>
          <p>
            Hi <strong>${invite.first_name}</strong>,
          </p>

          <p>
            Thank you for accepting our invitation to viewing
            ${invite.viewing_name} at ${invite.location} at
            ${printDateTime(invite.date_and_time, true)}. Please confirm by
            clicking the link below:
          </p>

          <p>
            <a
              href="${
                CONFIG.ENDPOINT_FOR_EMAIL
              }/confirm-invite/${leadID}/${viewingID}"}
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
        </div>`;

  return { subject, body };
}

async function sendEmails(viewingID, leads_to_email) {
  let { email_credentials } = CONFIG;
  console.log("leads_to_email", email_credentials, leads_to_email);
  let emails_sent;
  if (CONFIG.ENABLE_EMAIL_SENDING) {
    for (let i = 0; i < leads_to_email.length; i++) {
      let this_lead = leads_to_email[i];

      let leadID = this_lead.id;
      let this_email = await generateEmail(viewingID, leadID);
      let send_to_this_email = this_lead.email;
      let mailOptions = {
        from:
          email_credentials?.auth?.user ??
          CONFIG.DEFAULT_EMAIL_SENDER_ADDRESS ??
          CONFIG.DEFAULT_EMAIL_SENDER_ADDRESS,
        to: send_to_this_email,
        subject: this_email.subject,
        html: this_email.body,
      };
      colorPrint("cyan", "sending email...");
      console.log("sending", mailOptions);
      let res = await asyncSendMail(email_credentials, mailOptions);
      console.log("res", res);
    }
    emails_sent = leads_to_email.length;
  } else {
    emails_sent = leads_to_email.length;
  }

  return emails_sent;
}

async function createTablesIfNeeded() {
  await createTableIfNotExists(VIEWINGS_TABLE);
  await createTableIfNotExists(LEADS_TABLE);
  await createTableIfNotExists(INVITES_TABLE);
  let usersTableExisted = await createTableIfNotExists(USERS_TABLE);
  if (!usersTableExisted) {
    let user_pass = "password";
    const salt = await genSalt();
    const hashedPW = await hash(user_pass, salt);
    // ADD A TEST USERNAME AND PASSWORD:
    await addTableRecord(USERS_TABLE.name, {
      email: "test@user.com",
      pw: hashedPW,
    });
  }
}

// Serve static files from the React app build directory
app.use(express.json()); // Middleware for JSON body parsing

// Test route
app.post("/api/add-random", (req, res) => {
  console.log("req.body", req.body); // Should now show the sent number
  const num = req.body.number;
  const random = Math.floor(Math.random() * 10);
  res.json({ result: num + random, random });
});

// Serve React's static files
app.use(express.static(join(__dirname, "../build")));

// Catch-all handler
app.get("/{*any}", (req, res) => {
  res.sendFile(join(__dirname, "../build", "index.html"));
});

app.post("/api/get_tables", async (req, res) => {
  try {
    const viewings_result = await pool.query(
      `SELECT * FROM ${VIEWINGS_TABLE.name} order by id desc;`
    );
    const leads_result = await pool.query(
      `SELECT * FROM ${LEADS_TABLE.name} order by id desc;`
    );
    console.log("leads_result.rows", leads_result.rows.length);
    res.json({ viewings: viewings_result.rows, leads: leads_result.rows });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/invites/fetch", async (req, res) => {
  let { viewing_id } = req.body;
  let latest_invites = await getInvites(viewing_id);

  if (latest_invites.error) {
    res.status(500).json({ error: "Database error" });
  } else {
    let { invites } = latest_invites;
    res.json({ invites });
  }
});

async function get_particular_invite(viewingID, leadID) {
  let get_invite_SQL = `SELECT 
            l.first_name,
            l.last_name,            
            l.email,
            v.name AS viewing_name,
            v.location,
            v.date_and_time
        FROM ${INVITES_TABLE.name} i
        JOIN ${LEADS_TABLE.name} l 
            ON i.lead_id = l.id
        JOIN ${VIEWINGS_TABLE.name} v 
            ON i.viewing_id = v.id
        WHERE i.viewing_id = $1
          AND i.lead_id = $2;
      ;`;
  try {
    console.log("invite query", get_invite_SQL, [viewingID, leadID]);
    const invite_result = await pool.query(get_invite_SQL, [viewingID, leadID]);
    console.log("invites_result.rows", invite_result.rows);
    let invite = invite_result.rows?.[0] ?? null;
    console.log("invites_result.rows", invite);
    return { invite, error: null };
  } catch (error) {
    console.error("DB error:", err);
    return { error };
  }
}

// ==================================================================================

app.post("/api/invites/fetch_one", async (req, res) => {
  let { viewingID, leadID } = req.body;
  let this_invite = await get_particular_invite(viewingID, leadID);
  let { invite = null, error = null } = this_invite;
  if (error !== null) {
    res.status(500).json({ err: "Database error", error });
  } else {
    res.json({ invite });
  }
});

app.post("/api/invites/mark", async (req, res) => {
  const { leadIDs, viewing_id } = req.body; // name, location, date, time

  console.log("add invites", leadIDs);

  let status = "send_email";
  let SQL, query_params;
  try {
    const leads_placeholders = leadIDs.map((_, i) => `$${i + 2}`).join(", ");
    let update_SQL = `
              INSERT INTO ${INVITES_TABLE.name} (viewing_id, lead_id)
                SELECT $1, unnest($2::text[])
              RETURNING *;
            `; //                ON CONFLICT (viewing_id, lead_id) DO NOTHING
    query_params = [viewing_id];
    const result = await pool.query(update_SQL, [viewing_id, leadIDs]);
    if (result.rowsCount === 0) {
      console.log("invites not updated");
      return res.status(404).json({ error: "Not added" });
    }
    console.log("ADDED");
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Database error", details: error });
    return;
  }
  let latest_invites = await getInvites(viewing_id);
  if (latest_invites.error) {
    res.status(500).json({ error: "Database error" });
  } else {
    let { invites } = latest_invites;
    res.json({ invites });
  }
});

app.post("/api/invites/email", async (req, res) => {
  const { leadIDs, viewing_id } = req.body; // name, location, date, time

  console.log("add invites", leadIDs);
  let emails_sent = [];

  let SQL, query_params;
  try {
    const leads_placeholders = leadIDs.map((_, i) => `$${i + 2}`).join(", ");
    let update_SQL = `
           UPDATE ${INVITES_TABLE.name} i
              SET status = 'invited'
              FROM ${LEADS_TABLE.name} l
              WHERE i.lead_id = l.id
                AND i.viewing_id = $1
                AND i.lead_id = ANY($2::text[])
              RETURNING l.id, l.first_name,l.last_name, l.email;
            `;
    query_params = [viewing_id, leadIDs];
    console.log("SQL, params", update_SQL, query_params);
    const result = await pool.query(update_SQL, query_params);
    if (result.rowsCount === 0) {
      console.log("invites not updated");
      return res.status(404).json({ error: "Not added" });
    }
    let leads_to_email = result.rows;
    emails_sent = await sendEmails(viewing_id, leads_to_email);

    console.log("SENT EMAILS");
  } catch (error) {
    console.error("DB error:", error);
    return { error, emails_sent: 0 };
  }

  let latest_invites = await getInvites(viewing_id);
  if (latest_invites.error) {
    res.status(500).json({ error: "Database error" });
  } else {
    let { invites } = latest_invites;
    res.json({ invites, emails_sent });
  }
});

app.post("/api/invites/confirm/:leadID/:viewingID", async (req, res) => {
  const { leadID, viewingID } = req.params;

  console.log("leadID:", leadID);
  console.log("viewingID:", viewingID);

  let doubleCheckStatus_SQL = `SELECT status from ${INVITES_TABLE.name}
    WHERE viewing_id = $1 AND lead_id = $2
    ;`;

  let status_check = await pool.query(doubleCheckStatus_SQL, [
    viewingID,
    leadID,
  ]);
  let lead_invited_status = (status_check.rows?.[0] ?? {})?.status ?? "";
  console.log("lead_invited_status", lead_invited_status);
  if (lead_invited_status !== "invited") {
    let status;
    if (lead_invited_status === "accepted") {
      status = "already_accepted";
    } else {
      status = "error";
    }
    res.json({ success: false, status });
  } else {
    let atomic_check_then_update_SQL = `WITH updated AS (
          UPDATE ${VIEWINGS_TABLE.name}
          SET attending = attending + 1
          WHERE id = $1
            AND attending < max_attendees
          RETURNING *
        )
          SELECT CASE
              WHEN COUNT(*) > 0 THEN TRUE
              ELSE FALSE
            END AS success
          FROM updated;`;

    const result = await pool.query(atomic_check_then_update_SQL, [viewingID]);
    let { success = false } = result.rows?.[0] ?? {};
    console.log("atomic_check_then_update there_was_room:", success);
    if (success === false) {
      res.json({ success: false, status: "full" });
    } else {
      let change_status_SQL = `update ${INVITES_TABLE.name}
                  SET status = 'accepted'
                  WHERE viewing_id = $1 AND lead_id = $2;`;
      const result2 = await pool.query(change_status_SQL, [viewingID, leadID]);
      res.json({ success: true, status: "success" });
    }
  }
});

app.post("/api/invites/add_or_remove", async (req, res) => {
  const { viewing_id, lead_id, add_or_remove } = req.body; // name, location, date, time

  console.log("add add_or_remove_invite", viewing_id, lead_id, add_or_remove);

  if (add_or_remove === "add") {
    let result = await addTableRecord(INVITES_TABLE.name, {
      viewing_id,
      lead_id,
    });
  } else if (add_or_remove === "remove") {
    let result = await removeTableRecord(
      INVITES_TABLE.name,
      "viewing_id = $1 and lead_id = $2",
      [viewing_id, lead_id]
    );
  }

  if (result.error) {
    res.status(500).json({ error: "Database error", details: result.error });
  } else {
    res.json({ error: null, result });
  }
});

app.post("/api/viewings/add", async (req, res) => {
  const { viewing } = req.body; // name, location, date, time

  console.log("add viewing", viewing);

  let result = await addTableRecord(VIEWINGS_TABLE.name, viewing);
  if (result.error) {
    res.status(500).json({ error: "Database error", details: result.error });
  } else {
    let { new_id } = result;
    res.json({ error: null, new_id });
  }
});

app.post("/api/viewings/delete", async (req, res) => {
  const { id } = req.body;
  console.log("viewings/delete", id);

  let delete_viewing_SQL = `DELETE from ${VIEWINGS_TABLE.name} WHERE id = $1;`;
  const result = await pool.query(delete_viewing_SQL, [id]);

  console.log("result", result);

  if (result.error) {
    res.status(500).json({ error: "Database error", details: result.error });
  } else {
    res.json({ error: null, result });
  }
});

app.post("/api/viewings/edit", async (req, res) => {
  console.log("/api/viewings/edit");
  const { viewing } = req.body; // expects { id, name, location, date_and_time }
  console.log("/api/viewings/edit", viewing);
  try {
    const updateViewingSQL = `
      UPDATE ${VIEWINGS_TABLE.name}
      SET name = $1,
          location = $2,
          date_and_time = $3,
          max_attendees = $4
      WHERE id = $5
      RETURNING *;
    `;

    const result = await pool.query(updateViewingSQL, [
      viewing.name,
      viewing.location,
      viewing.date_and_time,
      viewing.max_attendees,
      viewing.id,
    ]);

    if (result.rowCount === 0) {
      console.log("no rows updated");
      return res.status(404).json({ error: "Viewing not updated" });
    }

    res.json({ error: null, lead: result.rows[0] });
  } catch (error) {
    console.error("Error updating Viewing:", error);
    res.status(500).json({ error: "Database error", details: error });
  }
});

app.post("/api/leads/delete", async (req, res) => {
  const { id } = req.body; // first_name, last_name

  let delete_lead_SQL = `DELETE from ${LEADS_TABLE.name} WHERE id = $1;`;
  const result = await pool.query(delete_lead_SQL, [id]);

  console.log("result", result);

  if (result.error) {
    res.status(500).json({ error: "Database error", details: result.error });
  } else {
    res.json({ error: null, result });
  }
});

app.post("/api/leads/add", async (req, res) => {
  const { lead } = req.body; // first_name, last_name

  console.log("add lead", lead);

  let result = await addTableRecord(LEADS_TABLE.name, lead);
  if (result.error) {
    res.status(500).json({ error: "Database error", details: result.error });
  } else {
    let { new_id } = result;
    res.json({ error: null, new_id });
  }
});

app.post("/api/leads/edit", async (req, res) => {
  console.log("/api/leads/edit");
  const { lead } = req.body; // expects { id, first_name, last_name, email }
  console.log("/api/leads/edit", lead);
  try {
    const updateLeadSQL = `
      UPDATE ${LEADS_TABLE.name}
      SET first_name = $1,
          last_name = $2,
          email = $3
      WHERE id = $4
      RETURNING *;
    `;

    const result = await pool.query(updateLeadSQL, [
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.id,
    ]);

    if (result.rowCount === 0) {
      console.log("no rows updated");
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json({ error: null, lead: result.rows[0] });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Database error", details: error });
  }
});

// =======================================

app.post("/api/login", async (req, res) => {
  const { un, pw } = req.body;

  let username = un.toLowerCase();

  const result = await pool.query(
    `SELECT id, pw from ${USERS_TABLE.name} 
          WHERE email = $1;`,
    [un]
  );
  if (result.rows.length < 1) {
    res.json({ success: false, error: "Email not found" });
  } else {
    if (await compare(pw, result.rows[0].pw)) {
      //console.log('Logging in...');
      var id = result.rows[0].id;

      res.json({ id, error: null, success: true });
    } else {
      res.json({ success: false, error: "Incorrect Password" });
    }
  }
});

const port = process.env.PORT || CONFIG.DEFAULT_PORT;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
