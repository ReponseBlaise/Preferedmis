import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { format } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async () => {
    toast.success("This is a simplified version");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t("attendance")}</h2>

      <div className="card">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Attendance;
