import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Select,
  Modal,
  Input,
  Alert,
  Popconfirm,
  Typography,
  Descriptions,
  Tooltip,
  Dropdown,
} from "antd";
import { BusIcon as BusBoldDuotoneIcon } from "@solar-icons/react/bold-duotone/bus";
import { api, errorMessage } from "../../api";
import { formatMoney } from "../../utils/formatters";
import InventoryNumberInput from "../../components/common/InventoryNumberInput";
import "./InventorySection.css";

function QlementineItemsListIcon({ size = 24, color = "#13C906" }) {
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

function FilterResetIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 19.5 19.5" fill="none">
      <path
        d="M18.7343 2.75C18.7844 2.03926 18.7232 1.58888 18.422 1.2574C17.9611 0.750003 17.1459 0.750003 15.5157 0.750003H3.98431C2.35403 0.750003 1.53888 0.750003 1.07794 1.2574C0.616993 1.76481 0.718099 2.55081 0.920311 4.12281C0.979365 4.5819 1.07758 4.84253 1.37732 5.19867C2.34562 6.34916 4.11899 8.39562 6.60744 10.2561C6.83484 10.4261 6.98407 10.7039 7.00926 11.0114C7.28959 14.4364 7.54641 16.7761 7.68276 17.9278C7.75428 18.532 8.42404 18.9966 8.97599 18.6064C9.90315 17.9506 11.6352 17.2157 11.8641 15.9942C11.9486 15.5434 12.0636 14.8303 12.195 13.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.7632 3.75L12.2639 5.83437L13.0934 5.31607C13.6843 4.86729 14.4187 4.60119 15.2146 4.60119C17.1671 4.60119 18.75 6.20151 18.75 8.1756C18.75 10.1497 17.1671 11.75 15.2146 11.75C13.5042 11.75 12.0775 10.522 11.75 8.89048"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArchiveIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 19.5 19.5" fill="none">
      <path
        d="M18.75 4.75013H0.750004V10.7501C0.750004 14.5214 0.750004 16.407 1.92158 17.5786C3.09315 18.7501 4.97877 18.7501 8.75 18.7501H10.75C14.5212 18.7501 16.4069 18.7501 17.5784 17.5786C18.75 16.407 18.75 14.5214 18.75 10.7501V4.75013Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.75 4.75013H0.750004L1.95 3.15013C2.83329 1.97242 3.27493 1.38356 3.90836 1.06684C4.5418 0.750126 5.27787 0.750126 6.75 0.750126H12.75C14.2221 0.750126 14.9582 0.750126 15.5916 1.06684C16.2251 1.38356 16.6667 1.97242 17.55 3.15013L18.75 4.75013Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 14.7501L9.75001 8.25013M6.75 12.2501C7.33984 12.857 8.90973 15.2501 9.75 15.2501C10.5903 15.2501 12.1602 12.857 12.75 12.2501"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusCircleIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M13 6C13 5.73478 12.8946 5.48043 12.7071 5.29289C12.5196 5.10536 12.2652 5 12 5C11.7348 5 11.4804 5.10536 11.2929 5.29289C11.1054 5.48043 11 5.73478 11 6V11H6C5.73478 11 5.48043 11.1054 5.29289 11.2929C5.10536 11.4804 5 11.7348 5 12C5 12.2652 5.10536 12.5196 5.29289 12.7071C5.48043 12.8946 5.73478 13 6 13H11V18C11 18.2652 11.1054 18.5196 11.2929 18.7071C11.4804 18.8946 11.7348 19 12 19C12.2652 19 12.5196 18.8946 12.7071 18.7071C12.8946 18.5196 13 18.2652 13 18V13H18C18.2652 13 18.5196 12.8946 18.7071 12.7071C18.8946 12.5196 19 12.2652 19 12C19 11.7348 18.8946 11.4804 18.7071 11.2929C18.5196 11.1054 18.2652 11 18 11H13V6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeViewIcon({ size = 18 }) {
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

function PencilEditIcon({ size = 17 }) {
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

function ShippingTruckIcon({ size = 18 }) {
  return (
    <svg width={size} height={size * 0.81} viewBox="0 0 21.5 17.5" fill="none">
      <circle cx="15.75" cy="14.25" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.75" cy="14.25" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13.25 14.25H8.25M18.25 14.25H19.0132C19.2331 14.25 19.3431 14.25 19.4355 14.2385C20.1169 14.1536 20.6536 13.6169 20.7385 12.9355C20.75 12.8431 20.75 12.7331 20.75 12.5132V9.75C20.75 6.16015 17.8399 3.25 14.25 3.25M13.75 12.25V3.75C13.75 2.33579 13.75 1.62868 13.3107 1.18934C12.8713 0.750004 12.1642 0.750004 10.75 0.750004H3.75C2.33579 0.750004 1.62868 0.750004 1.18934 1.18934C0.750004 1.62868 0.750004 2.33579 0.750004 3.75V11.75C0.750004 12.6846 0.750004 13.1519 0.950966 13.5C1.08262 13.728 1.27197 13.9174 1.5 14.049C1.84808 14.25 2.31539 14.25 3.25 14.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
      <path
        d="M7 1L1 7L7 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
      <path
        d="M1 1L7 7L1 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const emptyItem = {
  sku: "",
  name: "",
  itemType: "AC Unit",
  category: "Split Type",
  brand: "Carrier",
  capacity: "",
  unitOfMeasure: "UNIT",
  unitCost: 0,
  listPrice: 0,
  quantity: 0,
  reorderLevel: 3,
  supplier: "",
  compatibleModels: [],
};
const isContinuousUnit = (unit) =>
  ["METER", "FOOT", "KG", "LITER"].includes(unit);

const units = [
  "UNIT",
  "PCS",
  "METER",
  "FOOT",
  "KG",
  "LITER",
  "ROLL",
  "CYLINDER",
  "CYL",
  "PAIR",
  "CAN",
  "SET",
];

const CATALOG_SORTS = [
  { value: "item-az", label: "Item A–Z" },
  { value: "item-za", label: "Item Z–A" },
  { value: "sku-az", label: "SKU A–Z" },
  { value: "quantity-low", label: "Quantity low–high" },
  { value: "quantity-high", label: "Quantity high–low" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export default function InventorySection({
  items,
  brands,
  serviceVans = [],
  user,
  branchId,
  save,
  preselectedFilter,
  refresh,
  onNavigateToPostMovement,
  isDark = false,
}) {
  const canManage = user.role !== "EMPLOYEE";
  const [loadVanItem, setLoadVanItem] = useState(null);
  const [selectedVanId, setSelectedVanId] = useState("");
  const [loadQuantity, setLoadQuantity] = useState(1);
  const [loadNotes, setLoadNotes] = useState("");
  const [loadBusy, setLoadBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState(
    preselectedFilter && preselectedFilter.itemType
      ? preselectedFilter.itemType
      : "ALL",
  );
  const [status, setStatus] = useState(
    preselectedFilter && preselectedFilter.status
      ? preselectedFilter.status
      : "ALL",
  );
  const [category, setCategory] = useState(
    preselectedFilter && preselectedFilter.category
      ? preselectedFilter.category
      : "",
  );
  const [brand, setBrand] = useState("");
  const [archived, setArchived] = useState(false);
  const [archivedItems, setArchivedItems] = useState([]);
  const [archiveError, setArchiveError] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [values, setValues] = useState(emptyItem);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [suppliersList, setSuppliersList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("item-az");
  const pageSize = 6;

  const categoriesByType = {
    "AC Unit": ["Split Type", "Window Type", "Floor Mounted", "Portable"],
    "Spare Part": [
      "Compressors",
      "Fan Motors",
      "PCBs & Inverters",
      "Capacitors",
      "Sensors & Thermostats",
      "Valves & Coils",
    ],
    "Consumable": [
      "Refrigerants",
      "Copper Tubing",
      "Installation Materials",
      "Insulation & Aerotape",
      "Drain Hoses & Fittings",
      "Brazing & Silver Rods",
    ],
    "Tool / Equipment": [
      "Vacuum Pumps",
      "Manifold Gauges",
      "Flaring & Swaging Tools",
      "Clamp & Multimeters",
      "Leak Detectors",
      "Hand Tools",
    ],
    "Material / Part": [
      "Compressors",
      "Refrigerants",
      "Installation Materials",
      "Copper Tubing",
    ],
  };
  const categories = categoriesByType[values.itemType] || [
    "Compressors",
    "Refrigerants",
    "Installation Materials",
    "Copper Tubing",
  ];

  useEffect(() => {
    let active = true;
    const req = api("get", "/suppliers");
    if (req && typeof req.then === "function") {
      req
        .then((res) => {
          if (active && res && Array.isArray(res.data)) {
            setSuppliersList(res.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!archived) return;
    let active = true;
    setArchiveError("");
    setArchiveLoading(true);
    api("get", "/products", null, { branchId, archived: true })
      .then(({ data }) => {
        if (active) setArchivedItems(data);
      })
      .catch((err) => {
        if (active) setArchiveError(errorMessage(err));
      })
      .finally(() => {
        if (active) setArchiveLoading(false);
      });
    return () => {
      active = false;
    };
  }, [archived, branchId, items]);

  function field(name, value) {
    setValues({ ...values, [name]: value });
  }
  function open(item) {
    setValues(item || { ...emptyItem });
    setEditing(item ? item.id : "new");
    setFormError("");
  }
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError("");
    const payload = { ...values, branchId };
    if (editing !== "new") delete payload.quantity;
    save(
      editing === "new" ? "post" : "put",
      editing === "new" ? "/products" : `/products/${editing}`,
      payload,
      "Inventory item saved.",
    )
      .then(() => setEditing(null))
      .catch((err) => setFormError(errorMessage(err)))
      .finally(() => setBusy(false));
  }

  const visible = (archived ? archivedItems : items).filter((item) => {
    const matchesText = `${item.sku} ${item.name} ${item.brand}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return (
      matchesText &&
      (type === "ALL" || item.itemType === type) &&
      (!category || item.category === category) &&
      (!brand || item.brand === brand) &&
      (status === "ALL" ||
        (status === "LOW"
          ? item.quantity > 0 && item.quantity <= item.reorderLevel
          : item.quantity === 0))
    );
  });

  const sortedVisible = [...visible].sort((a, b) => {
    const textCompare = (first, second) =>
      String(first || "").localeCompare(String(second || ""), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    switch (sortBy) {
      case "item-za":
        return textCompare(b.name, a.name);
      case "sku-az":
        return textCompare(a.sku, b.sku);
      case "quantity-low":
        return Number(a.quantity || 0) - Number(b.quantity || 0);
      case "quantity-high":
        return Number(b.quantity || 0) - Number(a.quantity || 0);
      case "newest":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case "oldest":
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case "item-az":
      default:
        return textCompare(a.name, b.name);
    }
  });

  const totalEntries = sortedVisible.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startEntry = totalEntries === 0 ? 0 : (currentSafePage - 1) * pageSize + 1;
  const endEntry = Math.min(currentSafePage * pageSize, totalEntries);
  const paginatedData = sortedVisible.slice((currentSafePage - 1) * pageSize, currentSafePage * pageSize);

  const typeMenu = {
    items: [
      "ALL",
      "AC Unit",
      "Spare Part",
      "Consumable",
      "Tool / Equipment",
      "Material / Part",
    ].map((t) => ({
      key: t,
      label: t,
      onClick: () => {
        setType(t);
        setCurrentPage(1);
      },
    })),
  };

  const statusMenu = {
    items: [
      { key: "ALL", label: "All Stock Levels" },
      { key: "LOW", label: "Low Stock" },
      { key: "OUT", label: "Out of Stock" },
    ].map((s) => ({
      key: s.key,
      label: s.label,
      onClick: () => {
        setStatus(s.key);
        setCurrentPage(1);
      },
    })),
  };

  const categoryMenu = {
    items: [
      { key: "", label: "All Categories" },
      ...Array.from(new Set([
        ...Object.values(categoriesByType).flat(),
        ...items.map((item) => item.category).filter(Boolean),
      ])).sort().map((c) => ({ key: c, label: c })),
    ].map((c) => ({
      key: c.key || "all",
      label: c.label,
      onClick: () => {
        setCategory(c.key);
        setCurrentPage(1);
      },
    })),
  };

  const brandMenu = {
    items: [
      { key: "", label: "All Brands" },
      ...brands.map((b) => ({ key: b.name, label: b.name })),
    ].map((b) => ({
      key: b.key || "all",
      label: b.label,
      onClick: () => {
        setBrand(b.key);
        setCurrentPage(1);
      },
    })),
  };

  const sortMenu = {
    items: CATALOG_SORTS.map((option) => ({
      key: option.value,
      label: option.label,
      onClick: () => {
        setSortBy(option.value);
        setCurrentPage(1);
      },
    })),
  };

  const activeSortLabel =
    CATALOG_SORTS.find((option) => option.value === sortBy)?.label || "Item A–Z";

  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      width: "13%",
      render: (sku) => <span className="table-sku-cell">{sku}</span>,
    },
    {
      title: "ITEM",
      dataIndex: "name",
      width: "25%",
      render: (name) => <span className="table-item-name">{name}</span>,
    },
    {
      title: "TYPE / CATEGORY",
      width: "12%",
      align: "center",
      render: (_, item) => (
        <div className="table-type-cat">
          <span className="table-type-label">{item.itemType}</span>
          <span className="table-cat-label">{item.category}</span>
        </div>
      ),
    },
    {
      title: "BRAND",
      dataIndex: "brand",
      width: "10%",
      align: "center",
      render: (b) => <span>{b}</span>,
    },
    {
      title: "SELLING PRICE",
      width: "11%",
      align: "center",
      render: (_, item) => (
        <span className="table-price-cell">{formatMoney(item.listPrice)}</span>
      ),
    },
    {
      title: "STOCK & AVAILABILITY",
      width: "14%",
      align: "center",
      render: (_, item) => (
        <div>
          <span
            className={`stock-pill ${
              item.quantity === 0
                ? "no-stock"
                : item.quantity <= item.reorderLevel
                ? "low-stock"
                : "on-hand"
            }`}
          >
            {item.quantity} {item.unitOfMeasure}{" "}
            {item.quantity === 0
              ? "(No Stock)"
              : item.quantity <= item.reorderLevel
              ? "(Low Stock)"
              : "(On Hand)"}
          </span>
          {item.approvedRequestQuantity > 0 && (
            <div>
              <span className="stock-pill reserved">
                {item.approvedRequestQuantity} {item.unitOfMeasure} (Awaiting fulfillment)
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "REORDER LEVEL",
      width: "9%",
      align: "center",
      render: (_, item) => (
        <span>
          {item.reorderLevel} {item.unitOfMeasure}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      width: "16%",
      align: "center",
      render: (_, item) => (
        <div className="table-actions-wrap">
          <Tooltip title="View Specifications">
            <button
              type="button"
              className="table-action-btn"
              aria-label="View specifications"
              onClick={() => setViewing(item)}
            >
              <EyeViewIcon />
            </button>
          </Tooltip>
          {canManage && !archived && (
            <Tooltip title="Edit Specifications">
              <button
                type="button"
                className="table-action-btn"
                aria-label="Edit specifications"
                onClick={() => open(item)}
              >
                <PencilEditIcon />
              </button>
            </Tooltip>
          )}
          {canManage && (
            <Popconfirm
              title={
                archived
                  ? "Restore this item?"
                  : "Archive this zero-stock item?"
              }
              description="Stock history is retained."
              onConfirm={() =>
                save(
                  archived ? "post" : "delete",
                  archived
                    ? `/products/${item.id}/restore`
                    : `/products/${item.id}`,
                  archived ? { branchId } : null,
                  archived ? "Item restored." : "Item archived.",
                  { branchId },
                ).catch(() => {})
              }
            >
              <Tooltip title={archived ? "Restore Item" : "Archive Item"}>
                <button type="button" className="table-action-btn danger" aria-label={archived ? "Restore item" : "Archive item"}>
                  <ArchiveIcon />
                </button>
              </Tooltip>
            </Popconfirm>
          )}
          {canManage &&
            !archived &&
            item.quantity > 0 &&
            serviceVans.length > 0 && (
              <Tooltip title="Add to Service Vehicle">
                <button
                  type="button"
                  className="table-action-btn van"
                  aria-label="Add to Service Vehicle"
                  onClick={() => {
                    setLoadVanItem(item);
                    setSelectedVanId(serviceVans[0]?.id || "");
                    setLoadQuantity(1);
                    setLoadNotes("");
                    setLoadError("");
                  }}
                >
                  <ShippingTruckIcon />
                </button>
              </Tooltip>
            )}
        </div>
      ),
    },
  ];

  return (
    <div className="inventory-catalog-container" data-node-id="488:5029">
      <div className="inventory-catalog-card" data-node-id="488:5057">
        <div className="catalog-toolbar" data-node-id="488:5058">
          <div className="catalog-toolbar-left" data-node-id="488:5059">
            <div className="catalog-title-group" data-node-id="488:5060">
              <div className="catalog-list-icon-badge" data-node-id="488:5061">
                <QlementineItemsListIcon size={24} />
              </div>
              <h2 className="catalog-section-title" data-node-id="488:5063">
                Products List
              </h2>
            </div>

            <div className="catalog-search-wrap" data-node-id="488:5064">
              <span className="catalog-search-icon">
                <SearchIcon size={22} />
              </span>
              <input
                type="text"
                className="catalog-search-input"
                placeholder="Search SKU, name, or brand"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="catalog-search-clear"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="catalog-toolbar-right" data-node-id="488:5067">
            <Dropdown menu={typeMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="488:5068">
                <FilterIcon size={20} />
                <span>{type === "ALL" ? "ALL" : type}</span>
                <ChevronDownIcon size={12} />
              </div>
            </Dropdown>

            <Dropdown menu={statusMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="488:5073">
                <FilterIcon size={20} />
                <span>
                  {status === "ALL"
                    ? "All Stock Levels"
                    : status === "LOW"
                    ? "Low Stock"
                    : "Out of Stock"}
                </span>
                <ChevronDownIcon size={12} />
              </div>
            </Dropdown>

            <Dropdown menu={categoryMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="488:5078">
                <FilterIcon size={20} />
                <span>{category || "All Categories"}</span>
                <ChevronDownIcon size={12} />
              </div>
            </Dropdown>

            <Dropdown menu={brandMenu} trigger={["click"]}>
              <div className="catalog-filter-pill" data-node-id="488:5083">
                <FilterIcon size={20} />
                <span>{brand || "All Brands"}</span>
                <ChevronDownIcon size={12} />
              </div>
            </Dropdown>

            <Dropdown menu={sortMenu} trigger={["click"]}>
              <div className="catalog-filter-pill catalog-sort-pill" aria-label="Sort catalog">
                <span>↕</span>
                <span>{activeSortLabel}</span>
                <ChevronDownIcon size={12} />
              </div>
            </Dropdown>

            <div className="catalog-icon-group" data-node-id="488:5088">
              <Tooltip title="Reset all filters">
                <button
                  type="button"
                  className="catalog-icon-btn"
                  data-node-id="488:5089"
                  onClick={() => {
                    setSearch("");
                    setType("ALL");
                    setStatus("ALL");
                    setCategory("");
                    setBrand("");
                    setSortBy("item-az");
                    setCurrentPage(1);
                  }}
                >
                  <FilterResetIcon size={18} />
                </button>
              </Tooltip>

              <Tooltip title={archived ? "View active catalog items" : "View archived zero-stock items"}>
                <button
                  type="button"
                  className={`catalog-icon-btn ${archived ? "active" : ""}`}
                  aria-label={archived ? "View active catalog items" : "View archived zero-stock items"}
                  data-node-id="488:5091"
                  onClick={() => {
                    setArchived(!archived);
                    setCurrentPage(1);
                  }}
                >
                  <ArchiveIcon size={18} />
                </button>
              </Tooltip>
            </div>

            {canManage && (
              <button
                type="button"
                className="btn-post-movement"
                data-node-id="488:5093"
                onClick={onNavigateToPostMovement}
              >
                Post Movement
              </button>
            )}

            {canManage && (
              <button
                type="button"
                className="btn-register-item"
                data-node-id="442:4099"
                onClick={() => open(null)}
              >
                <PlusCircleIcon />
                <span>Register Item</span>
              </button>
            )}
          </div>
        </div>

        {archiveError ? (
          <Alert type="error" title={archiveError} />
        ) : (
          <div className="figma-catalog-table" data-node-id="442:4102">
            <Table
              dataSource={paginatedData}
              columns={columns}
              rowKey="id"
              loading={archiveLoading}
              scroll={{ x: 1000 }}
              pagination={false}
            />
          </div>
        )}

        <div className="catalog-pagination-wrap" data-node-id="442:4235">
          <span className="catalog-pagination-info" data-node-id="442:4237">
            Showing {startEntry} to {endEntry} of {totalEntries} entries
          </span>

          <div className="catalog-pagination-controls" data-node-id="442:4238">
            <button
              type="button"
              className="pagination-arrow-btn"
              disabled={currentSafePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-node-id="442:4239"
            >
              <ChevronLeftIcon />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`pagination-page-btn ${pageNumber === currentSafePage ? "active" : ""}`}
                onClick={() => setCurrentPage(pageNumber)}
                data-node-id={pageNumber === currentSafePage ? "442:4241" : undefined}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              className="pagination-arrow-btn"
              disabled={currentSafePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              data-node-id="442:4251"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="inventory-item-heading">
            <span className="inventory-item-heading-icon"><QlementineItemsListIcon size={24} /></span>
            <div>
              <h2>{editing === "new" ? "Register inventory item" : "Edit specifications"}</h2>
              <p>{editing === "new" ? "Add item details, starting stock, and pricing." : "Update the item details and pricing."}</p>
            </div>
          </div>
        }
        className={`inventory-item-modal${isDark ? " inventory-item-modal-dark" : ""}`}
        open={Boolean(editing)}
        onCancel={() => !busy && setEditing(null)}
        footer={null}
        width={700}
      >
        {formError && <Alert type="error" title={formError} />}
        <form className="inventory-item-form" onSubmit={submit}>
          <div className="inventory-item-body">
          <section className="inventory-item-section" aria-labelledby="inventory-details-heading">
          <div className="inventory-item-section-heading"><h3 id="inventory-details-heading">Item details</h3><span>Identify and classify your item</span></div>
          <div className="form-grid">
            <label className="field">
              SKU / model
              <Input
                required
                placeholder="e.g. AC-CAR-001"
                maxLength={100}
                disabled={editing !== "new"}
                value={values.sku}
                onChange={(e) => field("sku", e.target.value)}
              />
            </label>
            <label className="field">
              Item name
              <Input
                required
                placeholder="e.g. Carrier split-type air conditioner"
                maxLength={200}
                value={values.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label className="field">
              Item type
              <Select
                aria-label="Item type"
                value={values.itemType}
                onChange={(value) =>
                  setValues({
                    ...values,
                    itemType: value,
                    category:
                      value === "AC Unit"
                        ? "Split Type"
                        : value === "Spare Part"
                        ? "Compressors"
                        : value === "Consumable"
                        ? "Refrigerants"
                        : value === "Tool / Equipment"
                        ? "Vacuum Pumps"
                        : "Installation Materials",
                    unitOfMeasure:
                      editing === "new" && value === "AC Unit"
                        ? "UNIT"
                        : values.unitOfMeasure,
                  })
                }
                options={[
                  "AC Unit",
                  "Spare Part",
                  "Consumable",
                  "Tool / Equipment",
                  "Material / Part",
                ].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </label>
            <label className="field">
              Category
              <Select
                aria-label="Category"
                value={values.category}
                onChange={(value) => field("category", value)}
                options={categories.map((value) => ({ value, label: value }))}
              />
            </label>
            <label className="field">
              Brand
              <Select
                aria-label="Brand"
                showSearch
                value={values.brand}
                onChange={(value) => field("brand", value)}
                options={brands.map((entry) => ({
                  value: entry.name,
                  label: entry.name,
                }))}
              />
            </label>
            <label className="field">
              Capacity / specification
              <Input
                value={values.capacity}
                onChange={(e) => field("capacity", e.target.value)}
                placeholder="e.g. 1.5 HP or 1/4-inch tubing"
              />
            </label>
            <label className="field">
              Supplier / Vendor
              <Select
                showSearch
                allowClear
                placeholder="Select a supplier (optional)"
                value={values.supplier || undefined}
                onChange={(value) => field("supplier", value || "")}
                options={Array.from(
                  new Set([
                    ...suppliersList.map((s) => s.name),
                    ...(values.supplier ? [values.supplier] : []),
                  ]),
                ).map((name) => ({
                  value: name,
                  label: name,
                }))}
              />
            </label>
            <label className="field">
              Unit of measure
              <Select
                aria-label="Unit of measure"
                disabled={editing !== "new" || values.itemType === "AC Unit"}
                value={values.unitOfMeasure}
                onChange={(value) => field("unitOfMeasure", value)}
                options={units.map((value) => ({ value, label: value }))}
              />
            </label>
            {values.itemType !== "AC Unit" && (
              <label className="field inventory-item-wide-field">
                Compatible AC Unit Models / SKUs
                <Select
                  mode="tags"
                  placeholder="Select or enter compatible AC SKUs/models (e.g. CAR-1.0HP-CRY)"
                  value={values.compatibleModels || []}
                  onChange={(val) => field("compatibleModels", val)}
                  options={items
                    .filter((it) => it.itemType === "AC Unit")
                    .map((it) => ({
                      value: it.sku,
                      label: `${it.sku} — ${it.name}`,
                    }))}
                />
              </label>
            )}
          </div>
          </section>
          <section className="inventory-item-section" aria-labelledby="inventory-stock-heading">
          <div className="inventory-item-section-heading"><h3 id="inventory-stock-heading">Stock & pricing</h3><span>Amounts in Philippine pesos</span></div>
          <div className="form-grid">
            <label className="field">
              {editing === "new"
                ? "Opening quantity"
                : "Current stock (read only)"}
              <InventoryNumberInput
                aria-label={editing === "new" ? "Opening quantity" : "Current stock (read only)"}
                required
                min={0}
                step={isContinuousUnit(values.unitOfMeasure) ? 0.1 : 1}
                precision={isContinuousUnit(values.unitOfMeasure) ? 3 : 0}
                disabled={editing !== "new"}
                value={values.quantity}
                onChange={(value) => field("quantity", value)}
                style={{ width: "100%" }}
              />
              <small>{isContinuousUnit(values.unitOfMeasure) ? "Up to 3 decimal places allowed." : "Whole numbers only."}</small>
            </label>
            <label className="field">
              Unit cost (PHP)
              <InventoryNumberInput
                aria-label="Unit cost (PHP)"
                required
                prefix="₱"
                min={0}
                precision={2}
                value={values.unitCost}
                onChange={(value) => field("unitCost", value)}
                style={{ width: "100%" }}
              />
            </label>
            <label className="field">
              Selling price (PHP)
              <InventoryNumberInput
                aria-label="Selling price (PHP)"
                required
                prefix="₱"
                min={0}
                precision={2}
                value={values.listPrice}
                onChange={(value) => field("listPrice", value)}
                style={{ width: "100%" }}
              />
            </label>
            <label className="field">
              Reorder level (zero allowed)
              <InventoryNumberInput
                aria-label="Reorder level"
                required
                min={0}
                step={isContinuousUnit(values.unitOfMeasure) ? 0.1 : 1}
                precision={isContinuousUnit(values.unitOfMeasure) ? 3 : 0}
                value={values.reorderLevel}
                onChange={(value) => field("reorderLevel", value)}
                style={{ width: "100%" }}
              />
              <small>Low-stock alert threshold. Zero is allowed.</small>
            </label>
          </div>
          </section>
          </div>
          <div className="inventory-item-footer">
            <span>{editing === "new" ? "Opening stock is recorded in transaction history." : "Use Post Movement to adjust stock quantities."}</span>
            <Space>
              <Button onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
              <Button htmlType="submit" type="primary" aria-label="Save item" loading={busy}>Save item</Button>
            </Space>
          </div>
        </form>
      </Modal>
      <Modal
        title="Item specifications"
        open={Boolean(viewing)}
        onCancel={() => setViewing(null)}
        footer={null}
        maskClosable={false}
      >
        {viewing && (
          <Descriptions
            column={1}
            bordered
            items={[
              { key: "sku", label: "SKU", children: viewing.sku },
              { key: "name", label: "Name", children: viewing.name },
              {
                key: "brand",
                label: "Brand / specification",
                children: `${viewing.brand} / ${viewing.capacity || "Not applicable"}`,
              },
              {
                key: "qty",
                label: "Stock",
                children: `${viewing.quantity} ${viewing.unitOfMeasure}`,
              },
              {
                key: "cost",
                label: "Unit cost",
                children: formatMoney(viewing.unitCost),
              },
              {
                key: "price",
                label: "Selling price",
                children: formatMoney(viewing.listPrice),
              },
              {
                key: "supplier",
                label: "Supplier / Vendor",
                children: viewing.supplier || "Not specified",
              },
              ...(Array.isArray(viewing.compatibleModels) &&
              viewing.compatibleModels.length > 0
                ? [
                    {
                      key: "models",
                      label: "Compatible AC Units",
                      children: (
                        <Space wrap>
                          {viewing.compatibleModels.map((m) => (
                            <Tag key={m} color="blue">
                              {m}
                            </Tag>
                          ))}
                        </Space>
                      ),
                    },
                  ]
                : []),
              ...(Array.isArray(viewing.priceHistory) &&
              viewing.priceHistory.length > 0
                ? [
                    {
                      key: "priceHistory",
                      label: "Purchase Cost History",
                      children: (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {viewing.priceHistory.map((ph, idx) => (
                            <li key={idx}>
                              <strong>{formatMoney(ph.cost)}</strong> —{" "}
                              {new Date(ph.date).toLocaleDateString()} (
                              {ph.supplier || "Direct"} · {ph.note || "Logged"})
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(loadVanItem)}
        title={loadVanItem ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><BusBoldDuotoneIcon size={20}/>Load to Service Vehicle: {loadVanItem.name}</span> : ""}
        onCancel={() => setLoadVanItem(null)}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        {loadVanItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (loadBusy) return;
              setLoadBusy(true);
              setLoadError("");
              save(
                "post",
                "/transfers",
                {
                  branchId,
                  destinationId: selectedVanId,
                  productId: loadVanItem.id,
                  quantity: loadQuantity,
                  reason: loadNotes
                    ? `Vehicle Loadout: ${loadNotes}`
                    : `Stock loaded to vehicle ${selectedVanId}`,
                },
                `Successfully loaded ${loadQuantity} ${loadVanItem.unitOfMeasure} of ${loadVanItem.name} to Service Vehicle!`,
              )
                .then(() => {
                  setLoadVanItem(null);
                })
                .catch((err) => {
                  setLoadError(errorMessage(err));
                })
                .finally(() => setLoadBusy(false));
            }}
          >
            {loadError && (
              <Alert
                type="error"
                showIcon
                message={loadError}
                style={{ marginBottom: 12 }}
              />
            )}
            <div style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary">
                Current Warehouse Stock:{" "}
                <strong>
                  {loadVanItem.quantity} {loadVanItem.unitOfMeasure}
                </strong>
              </Typography.Text>
            </div>
            <label className="field" style={{ display: "block", marginBottom: 12 }}>
              Target Service Vehicle
              <Select
                value={selectedVanId}
                onChange={setSelectedVanId}
                style={{ width: "100%", marginTop: 4 }}
                options={serviceVans.map((van) => ({
                  value: van.id,
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <BusBoldDuotoneIcon size={16} />
                      {van.name} ({van.plateNumber ? `${van.plateNumber} · ` : ""}{van.status})
                    </span>
                  ),
                }))}
              />
            </label>
            <label className="field" style={{ display: "block", marginBottom: 12 }}>
              Quantity to Load ({loadVanItem.unitOfMeasure})
              <InventoryNumberInput
                aria-label="Quantity to load"
                required
                min={isContinuousUnit(loadVanItem.unitOfMeasure) ? 0.001 : 1}
                max={loadVanItem.quantity}
                step={isContinuousUnit(loadVanItem.unitOfMeasure) ? 0.1 : 1}
                precision={isContinuousUnit(loadVanItem.unitOfMeasure) ? 3 : 0}
                value={loadQuantity}
                onChange={setLoadQuantity}
                style={{ width: "100%", marginTop: 4 }}
              />
            </label>
            <label className="field" style={{ display: "block", marginBottom: 16 }}>
              Job / Dispatch Note (optional)
              <Input
                placeholder="e.g. Field restock for AC repair jobs"
                value={loadNotes}
                onChange={(e) => setLoadNotes(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </label>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => setLoadVanItem(null)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loadBusy}
                disabled={!selectedVanId || loadQuantity <= 0}
              >
                Confirm Load to Van
              </Button>
            </Space>
          </form>
        )}
      </Modal>
    </div>
  );
}
