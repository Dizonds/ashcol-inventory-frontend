import React, { useState, useEffect, useMemo } from "react";
import { Modal, Alert, message, Dropdown } from "antd";
import { api, errorMessage } from "../api";
import "./SuppliersPage.css";

/* --- EXACT ICONS FROM FIGMA NODE 488:7791 --- */

// Qlementine list icon (Figma node 457:15073)
function ItemsListIcon({ size = 24, color = "#13C906" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 3C0 2.3025 0 1.9545 0.0765 1.668C0.178789 1.2868 0.37955 0.939217 0.658633 0.660134C0.937717 0.38105 1.2853 0.180289 1.6665 0.078C1.953 0.00150001 2.301 0.0015 3 0.0015C3.699 0.0015 4.0455 0.00150001 4.332 0.078C5.109 0.2865 5.715 0.8925 5.922 1.668C5.9985 1.9545 5.9985 2.3025 5.9985 3C5.9985 3.6975 5.9985 4.0455 5.9235 4.332C5.82121 4.7132 5.62045 5.06078 5.34137 5.33987C5.06228 5.61895 4.7147 5.81971 4.3335 5.922C4.0455 5.9985 3.6975 5.9985 3 5.9985C2.3025 5.9985 1.9545 5.9985 1.668 5.922C1.2868 5.81971 0.939217 5.61895 0.660133 5.33987C0.38105 5.06078 0.180289 4.7132 0.078 4.332C0 4.0455 0 3.6975 0 3ZM3 4.5C2.637 4.5 2.4165 4.5 2.2485 4.4925C2.18418 4.49062 2.12005 4.48461 2.0565 4.4745C1.92913 4.44047 1.81298 4.37347 1.71976 4.28024C1.62653 4.18702 1.55953 4.07087 1.5255 3.9435C1.527 3.9495 1.515 3.912 1.5075 3.7515C1.5 3.5835 1.5 3.36 1.5 3C1.5 2.64 1.5 2.4165 1.5075 2.2485C1.515 2.088 1.527 2.0505 1.5255 2.0565C1.55953 1.92913 1.62653 1.81298 1.71976 1.71976C1.81298 1.62653 1.92913 1.55953 2.0565 1.5255C2.0505 1.527 2.088 1.515 2.2485 1.5075C2.4165 1.5 2.6385 1.5 3 1.5C3.3615 1.5 3.5835 1.5 3.7515 1.5075C3.912 1.515 3.9495 1.527 3.9435 1.5255C4.07087 1.55953 4.18702 1.62653 4.28024 1.71976C4.37347 1.81298 4.44047 1.92913 4.4745 2.0565C4.473 2.0505 4.485 2.088 4.4925 2.2485C4.5 2.4165 4.5 2.6385 4.5 3C4.5 3.3615 4.5 3.5835 4.4925 3.7515C4.49062 3.81582 4.48461 3.87995 4.4745 3.9435C4.44047 4.07087 4.37347 4.18702 4.28024 4.28024C4.18702 4.37347 4.07087 4.44047 3.9435 4.4745C3.9495 4.473 3.912 4.485 3.7515 4.4925C3.5835 4.5 3.3615 4.5 3 4.5ZM0 12C0 11.3025 0 10.9545 0.0765 10.668C0.178789 10.2868 0.37955 9.93922 0.658633 9.66013C0.937717 9.38105 1.2853 9.18029 1.6665 9.078C1.953 9.0015 2.301 9.0015 2.9985 9.0015C3.696 9.0015 4.044 9.0015 4.3305 9.078C5.1075 9.2865 5.7135 9.8925 5.9205 10.668C5.997 10.9545 5.997 11.3025 5.997 12C5.997 12.6975 5.997 13.0455 5.922 13.332C5.81971 13.7132 5.61895 14.0608 5.33987 14.3399C5.06078 14.6189 4.7132 14.8197 4.332 14.922C4.044 14.9985 3.696 14.9985 2.9985 14.9985C2.301 14.9985 1.953 14.9985 1.6665 14.922C1.2853 14.8197 0.937717 14.6189 0.658633 14.3399C0.37955 14.0608 0.178789 13.7132 0.0765 13.332C0 13.0455 0 12.6975 0 12ZM3 13.5C2.637 13.5 2.4165 13.5 2.2485 13.4925C2.18418 13.4906 2.12005 13.4846 2.0565 13.4745C1.92913 13.4405 1.81298 13.3735 1.71976 13.2802C1.62653 13.187 1.55953 13.0709 1.5255 12.9435C1.527 12.9495 1.515 12.912 1.5075 12.7515C1.5 12.5835 1.5 12.3615 1.5 12C1.5 11.6385 1.5 11.4165 1.5075 11.2485C1.515 11.088 1.527 11.0505 1.5255 11.0565C1.55953 10.9291 1.62653 10.813 1.71976 10.7198C1.81298 10.6265 1.92913 10.5595 2.0565 10.5255C2.0565 10.5255 2.0985 10.515 2.2485 10.5075C2.4165 10.5 2.6385 10.5 3 10.5C3.3615 10.5 3.5835 10.5 3.7515 10.5075C3.912 10.515 3.9495 10.527 3.9435 10.5255C4.07087 10.5595 4.18702 10.6265 4.28024 10.7198C4.37347 10.813 4.44047 10.9291 4.4745 11.0565C4.4745 11.0565 4.485 11.0985 4.4925 11.2485C4.5 11.4165 4.5 11.6385 4.5 12C4.5 12.3615 4.5 12.5835 4.4925 12.7515C4.49062 12.8158 4.48461 12.88 4.4745 12.9435C4.44047 13.0709 4.37347 13.187 4.28024 13.2802C4.18702 13.3735 4.07087 13.4405 3.9435 13.4745C3.9435 13.4745 3.9015 13.485 3.7515 13.4925C3.5835 13.5 3.3615 13.5 3 13.5ZM0.0765 19.65C0 19.9365 0 20.2845 0 20.982C0 21.6795 0 22.029 0.0765 22.314C0.178789 22.6952 0.37955 23.0428 0.658633 23.3219C0.937717 23.6009 1.2853 23.8017 1.6665 23.904C1.953 23.9805 2.301 23.9805 2.9985 23.9805C3.696 23.9805 4.044 23.9805 4.3305 23.904C4.7117 23.8017 5.05928 23.6009 5.33837 23.3219C5.61745 23.0428 5.81821 22.6952 5.9205 22.314C5.997 22.0275 5.997 21.6795 5.997 20.982C5.997 20.2845 5.997 19.935 5.922 19.65C5.81971 19.2688 5.61895 18.9212 5.33987 18.6421C5.06078 18.363 4.7132 18.1623 4.332 18.06C4.044 17.9835 3.696 17.9835 2.9985 17.9835C2.301 17.9835 1.953 17.9835 1.6665 18.06C1.2853 18.1623 0.937717 18.363 0.658633 18.6421C0.37955 18.9212 0.178789 19.2688 0.0765 19.65ZM2.2515 22.47C2.4195 22.4775 2.6415 22.4775 3.003 22.4775C3.3645 22.4775 3.588 22.4775 3.7545 22.47C3.81896 22.4709 3.88333 22.4649 3.9465 22.452C4.07359 22.4177 4.18943 22.3506 4.28238 22.2574C4.37532 22.1642 4.4421 22.0482 4.476 21.921C4.476 21.9165 4.4865 21.87 4.494 21.729C4.5015 21.561 4.5015 21.339 4.5015 20.979C4.5015 20.619 4.5015 20.394 4.494 20.226C4.4865 20.076 4.476 20.034 4.476 20.034C4.44187 19.9071 4.37499 19.7914 4.28206 19.6984C4.18913 19.6055 4.07341 19.5386 3.9465 19.5045C3.9465 19.5045 3.9045 19.494 3.7545 19.488C3.5865 19.4805 3.3645 19.479 3.003 19.479C2.6415 19.479 2.4195 19.479 2.2515 19.488C2.18721 19.4894 2.12308 19.4949 2.0595 19.5045C1.93241 19.5388 1.81657 19.6059 1.72362 19.6991C1.63068 19.7923 1.5639 19.9083 1.53 20.0355C1.53 20.0355 1.5195 20.0775 1.512 20.2275C1.5045 20.3955 1.5045 20.6175 1.5045 20.979C1.5045 21.3405 1.5045 21.564 1.512 21.7305C1.5195 21.891 1.5315 21.9285 1.53 21.9225C1.56403 22.0499 1.63103 22.166 1.72426 22.2592C1.81748 22.3525 1.93363 22.4195 2.061 22.4535C2.12455 22.4636 2.18868 22.4696 2.253 22.4715L2.2515 22.47Z"
        fill={color}
      />
      <path
        d="M9.75 3C9.55109 3 9.36032 3.07902 9.21967 3.21967C9.07902 3.36032 9 3.55109 9 3.75C9 3.94891 9.07902 4.13968 9.21967 4.28033C9.36032 4.42098 9.55109 4.5 9.75 4.5H23.25C23.4489 4.5 23.6397 4.42098 23.7803 4.28033C23.921 4.13968 24 3.94891 24 3.75C24 3.55109 23.921 3.36032 23.7803 3.21967C23.6397 3.07902 23.4489 3 23.25 3H9.75ZM9 12.75C9 12.5511 9.07902 12.3603 9.21967 12.2197C9.36032 12.079 9.55109 12 9.75 12H23.25C23.4489 12 23.6397 12.079 23.7803 12.2197C23.921 12.3603 24 12.5511 24 12.75C24 12.9489 23.921 13.1397 23.7803 13.2803C23.6397 13.421 23.4489 13.5 23.25 13.5H9.75C9.55109 13.5 9.36032 13.421 9.21967 13.2803C9.07902 13.1397 9 12.9489 9 12.75ZM9.75 21C9.55109 21 9.36032 21.079 9.21967 21.2197C9.07902 21.3603 9 21.5511 9 21.75C9 21.9489 9.07902 22.1397 9.21967 22.2803C9.36032 22.421 9.55109 22.5 9.75 22.5H23.25C23.4489 22.5 23.6397 22.421 23.7803 22.2803C23.921 22.1397 24 21.9489 24 21.75C24 21.5511 23.921 21.3603 23.7803 21.2197C23.6397 21.079 23.4489 21 23.25 21H9.75Z"
        fill={color}
      />
    </svg>
  );
}

// UIL Search icon (Figma node 440:1874)
function SearchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M21.71 20.29L18 16.61C19.4401 14.8144 20.1375 12.5353 19.9488 10.2413C19.7601 7.9473 18.6997 5.81278 16.9855 4.27664C15.2714 2.74051 13.0338 1.91951 10.7329 1.98247C8.43204 2.04543 6.24272 2.98756 4.61514 4.61514C2.98756 6.24272 2.04543 8.43204 1.98247 10.7329C1.91951 13.0338 2.74051 15.2714 4.27664 16.9855C5.81278 18.6997 7.9473 19.7601 10.2413 19.9488C12.5353 20.1375 14.8144 19.4401 16.61 18L20.29 21.68C20.383 21.7737 20.4936 21.8481 20.6154 21.8989C20.7373 21.9497 20.868 21.9758 21 21.9758C21.132 21.9758 21.2627 21.9497 21.3846 21.8989C21.5064 21.8481 21.617 21.7737 21.71 21.68C21.8902 21.4935 21.991 21.2443 21.991 20.985C21.991 20.7257 21.8902 20.4765 21.71 20.29ZM11 18C9.61553 18 8.26215 17.5895 7.11101 16.8203C5.95986 16.0511 5.06266 14.9579 4.53284 13.6788C4.00303 12.3997 3.86441 10.9922 4.1345 9.63437C4.4046 8.2765 5.07129 7.02922 6.05025 6.05025C7.02922 5.07129 8.2765 4.4046 9.63437 4.1345C10.9922 3.86441 12.3997 4.00303 13.6788 4.53284C14.9579 5.06266 16.0511 5.95986 16.8203 7.11101C17.5895 8.26215 18 9.61553 18 11C18 12.8565 17.2625 14.637 15.9497 15.9497C14.637 17.2625 12.8565 18 11 18Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Proicons filter (Figma node 440:1901)
function FilterIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M6 9.66667H26M9.84667 16H22.1533M13.6933 22.3333H18.3067"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// SI Add Fill (Figma node 440:1891)
function AddIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M13 6C13 5.73478 12.8946 5.48043 12.7071 5.29289C12.5196 5.10536 12.2652 5 12 5C11.7348 5 11.4804 5.10536 11.2929 5.29289C11.1054 5.48043 11 5.73478 11 6V11H6C5.73478 11 5.48043 11.1054 5.29289 11.2929C5.10536 11.4804 5 11.7348 5 12C5 12.2652 5.10536 12.5196 5.29289 12.7071C5.48043 12.8946 5.73478 13 6 13H11V18C11 18.2652 11.1054 18.5196 11.2929 18.7071C11.4804 18.8946 11.7348 19 12 19C12.2652 19 12.5196 18.8946 12.7071 18.7071C12.8946 18.5196 13 18.2652 13 18V13H18C18.2652 13 18.5196 12.8946 18.7071 12.7071C18.8946 12.5196 19 12.2652 19 12C19 11.7348 18.8946 11.4804 18.7071 11.2929C18.5196 11.1054 18.2652 11 18 11H13V6Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Chevron Down
function ChevronDownIcon({ size = 12 }) {
  return (
    <svg width={size} height={size * 0.58} viewBox="0 0 12 7" fill="none">
      <path
        d="M1 1L6 6L11 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// View / Eye Icon (Figma node 457:15332)
function EyeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 21.5 15.5" fill="none">
      <path
        d="M20.294 6.79498C20.598 7.2213 20.75 7.43447 20.75 7.75C20.75 8.06553 20.598 8.27869 20.294 8.70501C18.9279 10.6206 15.4392 14.75 10.75 14.75C6.06078 14.75 2.5721 10.6206 1.20604 8.70502C0.902014 8.2787 0.75 8.06553 0.75 7.75C0.75 7.43447 0.902013 7.22131 1.20604 6.79499C2.5721 4.87944 6.06078 0.75 10.75 0.75C15.4392 0.75 18.9279 4.87944 20.294 6.79498Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="10.75" cy="7.75" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

// Pen / Edit Icon (Figma node 444:4547)
function PenIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18.5 18.5" fill="none">
      <path
        d="M0.750088 16.2353V17.75H2.26481C3.49106 17.75 4.10418 17.75 4.6555 17.5216C5.20681 17.2933 5.64036 16.8597 6.50745 15.9926L16.3714 6.12868C17.254 5.24612 17.6953 4.80483 17.744 4.26325C17.7521 4.17372 17.7521 4.08364 17.744 3.99411C17.6953 3.45253 17.254 3.01124 16.3714 2.12868C15.4888 1.24612 15.0476 0.804833 14.506 0.756049C14.4164 0.747984 14.3264 0.747984 14.2368 0.756049C13.6953 0.804833 13.254 1.24612 12.3714 2.12868L2.50745 11.9926C1.64036 12.8597 1.20681 13.2933 0.97845 13.8446C0.750088 14.3959 0.750088 15.009 0.750088 16.2353Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.7503 3.75L14.7503 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Delete / Trash Icon (Figma node 457:15685)
function TrashIcon({ size = 17 }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 19.5 21.5" fill="none">
      <path
        d="M17.25 4.25L16.6303 14.2751C16.4719 16.8365 16.3928 18.1171 15.7508 19.0379C15.4333 19.4931 15.0247 19.8773 14.5507 20.166C13.5921 20.75 12.309 20.75 9.74274 20.75C7.17312 20.75 5.8883 20.75 4.92905 20.1649C4.4548 19.8757 4.046 19.4908 3.72868 19.0348C3.08688 18.1126 3.00945 16.8301 2.85461 14.2652L2.25 4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M0.75 4.25H18.75M13.8057 4.25L13.1231 2.84173C12.6696 1.90626 12.4428 1.43852 12.0517 1.14681C11.965 1.0821 11.8731 1.02454 11.777 0.974702C11.3439 0.750001 10.8241 0.750001 9.78453 0.750001C8.71883 0.750001 8.18598 0.750001 7.74568 0.984121C7.6481 1.03601 7.55498 1.0959 7.46729 1.16317C7.07164 1.4667 6.85063 1.95155 6.40861 2.92126L5.80292 4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M7.25 15.25L7.25 9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.25 15.25L12.25 9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SuppliersPage({ user, save, refresh, items = [], isDark = false }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterTerm, setFilterTerm] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Matching Figma: 6 rows per page

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    terms: "Net 30 Days",
  });

  const canManage = user && user.role !== "EMPLOYEE";

  // Fetch suppliers from backend
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api("get", "/suppliers")
      .then(({ data }) => {
        if (active) {
          setSuppliers(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  // Filter & Search Logic
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // Payment terms filter
      if (filterTerm !== "ALL") {
        const normFilter = filterTerm.toLowerCase().replace(/\s+/g, "");
        const normTerms = (s.terms || "").toLowerCase().replace(/\s+/g, "");
        if (!normTerms.includes(normFilter)) {
          return false;
        }
      }
      // Text search
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const combined = `${s.name || ""} ${s.contactPerson || ""} ${s.phone || ""} ${s.email || ""} ${s.address || ""} ${s.terms || ""}`.toLowerCase();
      return combined.includes(q);
    });
  }, [suppliers, search, filterTerm]);

  // Reset to page 1 when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterTerm]);

  // Pagination calculation
  const totalEntries = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentEntries = filteredSuppliers.slice(startIndex, startIndex + pageSize);

  // Form Handlers
  function handleOpenCreate() {
    setFormData({
      id: "",
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      terms: "Net 30 Days",
    });
    setFormError("");
    setFormModalOpen(true);
  }

  function handleOpenEdit(supplier) {
    setFormData({
      id: supplier.id || supplier._id || "",
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      terms: supplier.terms || "Net 30 Days",
    });
    setFormError("");
    setFormModalOpen(true);
  }

  function handleOpenView(supplier) {
    setSelectedSupplier(supplier);
    setViewModalOpen(true);
  }

  function handleDelete(supplier) {
    Modal.confirm({
      title: "Delete Supplier Record",
      content: `Are you sure you want to remove "${supplier.name}"? This action cannot be undone.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        const id = supplier.id || supplier._id;
        if (!id) {
          message.error("Supplier ID not found.");
          return;
        }
        return save("delete", `/suppliers/${id}`, null, "Supplier deleted.")
          .then(() => {
            setSuppliers((prev) => prev.filter((item) => (item.id || item._id) !== id));
          })
          .catch((err) => {
            message.error(errorMessage(err));
          });
      },
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }
    setBusy(true);
    setFormError("");

    save("post", "/suppliers", formData, formData.id ? "Supplier updated." : "Supplier registered.")
      .then((savedSupplier) => {
        setFormModalOpen(false);
        // Optimistic refresh
        if (savedSupplier) {
          setSuppliers((prev) => {
            const index = prev.findIndex((s) => (s.id || s._id) === (savedSupplier.id || savedSupplier._id));
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = savedSupplier;
              return updated;
            }
            return [savedSupplier, ...prev];
          });
        }
      })
      .catch((err) => setFormError(errorMessage(err)))
      .finally(() => setBusy(false));
  }

  // Filter dropdown items
  const filterMenuItems = [
    { key: "ALL", label: "ALL Payment Terms" },
    { key: "Net 30", label: "Net 30 Days" },
    { key: "Net 15", label: "Net 15 Days" },
    { key: "Net 60", label: "Net 60 Days" },
    { key: "Cash on Delivery", label: "Cash on Delivery" },
  ];

  return (
    <div className="suppliers-page-container">
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 12, borderRadius: 10 }}
        />
      )}

      {/* Main Container Card (Figma Node 457:15069) */}
      <div className="suppliers-card">
        {/* Card Toolbar / Header (Node 457:15070) */}
        <div className="suppliers-toolbar">
          <div className="suppliers-toolbar-left">
            <div className="suppliers-title-group">
              <div className="suppliers-title-icon-badge">
                <ItemsListIcon size={24} />
              </div>
              <h2 className="suppliers-card-title">Suppliers List</h2>
            </div>

            {/* Inset Search Input (Node 457:15076) */}
            <div className="suppliers-search-box">
              <div className="suppliers-search-icon">
                <SearchIcon size={22} />
              </div>
              <input
                type="text"
                className="suppliers-search-input"
                placeholder="Search name, phone, or brand"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="suppliers-search-clear"
                  onClick={() => setSearch("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="suppliers-toolbar-right">
            {/* Filter Dropdown (Node 457:15080) */}
            <Dropdown
              menu={{
                items: filterMenuItems,
                onClick: ({ key }) => setFilterTerm(key),
              }}
              trigger={["click"]}
            >
              <div className="suppliers-filter-btn" role="button" tabIndex={0}>
                <div className="suppliers-filter-label">
                  <FilterIcon size={20} />
                  <span>{filterTerm === "ALL" ? "ALL" : filterTerm}</span>
                </div>
                <div className="suppliers-filter-arrow">
                  <ChevronDownIcon size={12} />
                </div>
              </div>
            </Dropdown>

            {/* Register Supplier Button (Node 457:15108) */}
            {canManage && (
              <button
                type="button"
                className="suppliers-register-btn"
                onClick={handleOpenCreate}
              >
                <AddIcon size={24} />
                <span>Register Supplier</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Wrapper & Table (Node 457:15111) */}
        <div className="suppliers-table-wrapper">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>SUPPLIER NAME</th>
                <th style={{ width: "14%" }}>CONTACT PERSON</th>
                <th className="text-center" style={{ width: "13%" }}>PHONE</th>
                <th className="text-center" style={{ width: "16%" }}>EMAIL</th>
                <th className="text-center" style={{ width: "12%" }}>PAYMENT TERMS</th>
                <th className="text-center" style={{ width: "12%" }}>ADDRESS</th>
                <th className="text-center" style={{ width: "9%" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="suppliers-empty-state">
                    Loading suppliers...
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="suppliers-empty-state">
                    {search || filterTerm !== "ALL"
                      ? "No suppliers match your search criteria."
                      : "No registered suppliers found. Click 'Register Supplier' above."}
                  </td>
                </tr>
              ) : (
                currentEntries.map((supplier) => {
                  const key = supplier.id || supplier._id || supplier.name;
                  return (
                    <tr key={key}>
                      {/* Supplier Name */}
                      <td className="supplier-name-cell">
                        {supplier.name}
                      </td>

                      {/* Contact Person */}
                      <td className="supplier-contact-cell">
                        {supplier.contactPerson || "—"}
                      </td>

                      {/* Phone */}
                      <td className="supplier-phone-cell text-center">
                        {supplier.phone || "—"}
                      </td>

                      {/* Email */}
                      <td className="supplier-email-cell text-center">
                        {supplier.email || "—"}
                      </td>

                      {/* Payment Terms */}
                      <td className="text-center">
                        <span className="supplier-terms-badge">
                          {supplier.terms || "Net 30 Days"}
                        </span>
                      </td>

                      {/* Address */}
                      <td className="supplier-address-cell text-center">
                        {supplier.address || "—"}
                      </td>

                      {/* Actions (View, Edit, Delete) (Node 457:15330) */}
                      <td className="text-center">
                        <div className="suppliers-action-group">
                          {/* View Button */}
                          <button
                            type="button"
                            className="suppliers-action-btn view-btn"
                            title="View Details"
                            onClick={() => handleOpenView(supplier)}
                          >
                            <EyeIcon size={18} />
                          </button>

                          {/* Edit Button */}
                          {canManage && (
                            <button
                              type="button"
                              className="suppliers-action-btn edit-btn"
                              title="Edit Supplier"
                              onClick={() => handleOpenEdit(supplier)}
                            >
                              <PenIcon size={16} />
                            </button>
                          )}

                          {/* Delete Button */}
                          {canManage && (
                            <button
                              type="button"
                              className="suppliers-action-btn delete-btn"
                              title="Delete Supplier"
                              onClick={() => handleDelete(supplier)}
                            >
                              <TrashIcon size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Node 457:15427) */}
        <div className="suppliers-pagination-row">
          <div className="suppliers-entries-info">
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + pageSize, totalEntries)} of {totalEntries} entries
          </div>

          <div className="suppliers-pagination-controls">
            {/* Previous Page Button */}
            <button
              type="button"
              className="suppliers-page-nav-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path
                  d="M7 1L1 7L7 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`suppliers-page-num-btn ${currentPage === pageNum ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            {/* Next Page Button */}
            <button
              type="button"
              className="suppliers-page-nav-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path
                  d="M1 1L7 7L1 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- REGISTER / EDIT SUPPLIER MODAL --- */}
      <Modal
        title={formData.id ? "Edit Supplier Record" : "Register New Supplier"}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        footer={null}
        destroyOnClose
        width={560}
        maskClosable={false}
      >
        {formError && (
          <Alert
            type="error"
            showIcon
            message={formError}
            style={{ marginBottom: 16 }}
          />
        )}
        <form onSubmit={handleFormSubmit}>
          <div className="suppliers-modal-grid">
            <div className="suppliers-modal-field full-width">
              <label>Company / Supplier Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Carrier Air Conditioning Philippines, Inc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="suppliers-modal-field">
              <label>Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Michael Santos"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div className="suppliers-modal-field">
              <label>Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +63 917 845 2310"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="suppliers-modal-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="e.g. msantos@carrierph.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="suppliers-modal-field">
              <label>Payment Terms</label>
              <select
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              >
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Post Dated Check (PDC)">Post Dated Check (PDC)</option>
                <option value="Advance Payment">Advance Payment</option>
              </select>
            </div>

            <div className="suppliers-modal-field full-width">
              <label>Warehouse / Business Address</label>
              <textarea
                rows={2}
                placeholder="e.g. Pasig City, Metro Manila"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="suppliers-modal-actions">
            <button
              type="button"
              className="suppliers-page-nav-btn"
              style={{ width: "auto", padding: "0 18px" }}
              onClick={() => setFormModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="suppliers-register-btn"
              disabled={busy}
            >
              <AddIcon size={20} />
              <span>{busy ? "Saving..." : formData.id ? "Save Changes" : "Register Supplier"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW SUPPLIER DETAILS MODAL --- */}
      <Modal
        title="Supplier Overview"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={540}
        maskClosable={false}
      >
        {selectedSupplier && (
          <div className="supplier-detail-card">
            <div className="supplier-detail-header-block">
              <div className="supplier-detail-avatar">
                {(selectedSupplier.name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: "inherit" }}>
                  {selectedSupplier.name}
                </h3>
                <span className="supplier-terms-badge" style={{ marginTop: 4 }}>
                  {selectedSupplier.terms || "Net 30 Days"}
                </span>
              </div>
            </div>

            <div className="supplier-detail-info-row">
              <span className="supplier-detail-label">Contact Person:</span>
              <span className="supplier-detail-val">{selectedSupplier.contactPerson || "Not provided"}</span>
            </div>

            <div className="supplier-detail-info-row">
              <span className="supplier-detail-label">Phone:</span>
              <span className="supplier-detail-val">{selectedSupplier.phone || "Not provided"}</span>
            </div>

            <div className="supplier-detail-info-row">
              <span className="supplier-detail-label">Email:</span>
              <span className="supplier-detail-val">
                {selectedSupplier.email ? (
                  <a href={`mailto:${selectedSupplier.email}`} style={{ color: "#13c906" }}>
                    {selectedSupplier.email}
                  </a>
                ) : (
                  "Not provided"
                )}
              </span>
            </div>

            <div className="supplier-detail-info-row">
              <span className="supplier-detail-label">Address:</span>
              <span className="supplier-detail-val">{selectedSupplier.address || "Not provided"}</span>
            </div>

            {/* Supplied Catalog Items */}
            {items && items.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                <span className="supplier-detail-label" style={{ display: "block", marginBottom: 8 }}>
                  Supplied Products in Inventory:
                </span>
                {(() => {
                  const suppliedParts = items.filter(
                    (p) =>
                      (p.supplier || "").toLowerCase().includes((selectedSupplier.name || "").toLowerCase()) ||
                      (selectedSupplier.name || "").toLowerCase().includes((p.supplier || "").toLowerCase())
                  );
                  if (suppliedParts.length === 0) {
                    return (
                      <span style={{ fontSize: 13, color: "gray" }}>
                        No parts currently tagged to this supplier in the inventory database.
                      </span>
                    );
                  }
                  return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {suppliedParts.slice(0, 8).map((part) => (
                        <span
                          key={part.id || part._id}
                          style={{
                            fontSize: 12.5,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "rgba(19, 201, 6, 0.08)",
                            color: "#006830",
                            border: "1px solid rgba(19, 201, 6, 0.2)",
                          }}
                        >
                          {part.sku} - {part.productName || part.name}
                        </span>
                      ))}
                      {suppliedParts.length > 8 && (
                        <span style={{ fontSize: 12, color: "gray", alignSelf: "center" }}>
                          +{suppliedParts.length - 8} more
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button
                type="button"
                className="suppliers-page-nav-btn"
                style={{ width: "auto", padding: "0 20px" }}
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
