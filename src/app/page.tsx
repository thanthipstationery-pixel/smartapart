'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './dashboard.module.css';
import { formatThaiDateNumeric, formatThaiDateLong, formatThaiBillingPeriod, formatThaiMonthOnly, getShortBuildingName, THAI_MONTHS } from '@/lib/thaiDate';
import { calculateCheckInPayment, getPayInAdvanceBillingPeriod, validateCheckOutNotice } from '@/lib/billingRules';
import OverviewTab from '@/components/tabs/OverviewTab';
import FloorMapTab from '@/components/tabs/FloorMapTab';
import MeterTab from '@/components/tabs/MeterTab';
import InvoiceTab from '@/components/tabs/InvoiceTab';
import TenantTab from '@/components/tabs/TenantTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import RoomModal from '@/components/modals/RoomModal';
import CheckInModal from '@/components/modals/CheckInModal';
import CheckOutModal from '@/components/modals/CheckOutModal';
import BookingModal from '@/components/modals/BookingModal';
import InvoiceDetailModal from '@/components/modals/InvoiceDetailModal';
import PaymentModal from '@/components/modals/PaymentModal';
import BatchPrintModal from '@/components/modals/BatchPrintModal';
import EditTenantModal from '@/components/modals/EditTenantModal';
import BulkInvoiceModal from '@/components/modals/BulkInvoiceModal';
import OverdueModal from '@/components/modals/OverdueModal';
import RoomTransferModal from '@/components/modals/RoomTransferModal';
import ReplaceMeterModal from '@/components/modals/ReplaceMeterModal';

// Inline SVGs for lightweight, zero-dependency modern icons
const Icons = {
  Overview: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
  ),
  Map: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
  ),
  Meter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><path d="M12 7a5 5 0 0 0-5 5c0 .61.11 1.19.3 1.73l1.96-1.96a3 3 0 1 1 4.24 4.24l-1.96 1.96c.54.19 1.12.3 1.73.3a5 5 0 0 0 5-5 5 5 0 0 0-5-5z"/></svg>
  ),
  Invoice: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
  ),
  Moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  )
};

export default function Dashboard() {
  const router = useRouter();
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'meter' | 'invoices' | 'tenants' | 'settings'>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [adminUser, setAdminUser] = useState<{ username: string; name: string } | null>(null);

  // Initialize theme selection
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  const [buildings, setBuildings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected details
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [settingsBuildingId, setSettingsBuildingId] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Rooms settings list filters
  const [roomsSearchQuery, setRoomsSearchQuery] = useState('');
  const [roomsTypeFilter, setRoomsTypeFilter] = useState('ALL');
  const [roomsWaterFilter, setRoomsWaterFilter] = useState('ALL');
  const [roomsElecFilter, setRoomsElecFilter] = useState('ALL');
  const [roomsStatusFilter, setRoomsStatusFilter] = useState('ALL');
  const [showRoomsAdvancedFilters, setShowRoomsAdvancedFilters] = useState(false);
  
  // Modals status
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [showReplaceMeterModal, setShowReplaceMeterModal] = useState(false);

  // Forms inputs state
  const [checkInName, setCheckInName] = useState('');
  const [checkInPhone, setCheckInPhone] = useState('');
  const [checkInIdCard, setCheckInIdCard] = useState('');
  const [checkInEmail, setCheckInEmail] = useState('');
  const [checkInLineId, setCheckInLineId] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInWaterMeter, setCheckInWaterMeter] = useState('');
  const [checkInElecMeter, setCheckInElecMeter] = useState('');
  const [checkInAddress, setCheckInAddress] = useState('');
  const [checkInWorkplace, setCheckInWorkplace] = useState('');
  const [checkInEmergencyName, setCheckInEmergencyName] = useState('');
  const [checkInEmergencyRel, setCheckInEmergencyRel] = useState('');
  const [checkInEmergencyPhone, setCheckInEmergencyPhone] = useState('');
  const [checkInSecurityDeposit, setCheckInSecurityDeposit] = useState('');
  const [checkInUseKeycard, setCheckInUseKeycard] = useState(false);
  const [checkInKeycardCount, setCheckInKeycardCount] = useState('1');
  const [checkInKeycardDeposit, setCheckInKeycardDeposit] = useState('100');
  const [checkInKeycardCode, setCheckInKeycardCode] = useState('');
  const [checkInNote, setCheckInNote] = useState('');

  // Check-out modal states
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [activeCheckOutTenant, setActiveCheckOutTenant] = useState<any>(null);
  const [checkOutDate, setCheckOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutFinalWater, setCheckOutFinalWater] = useState('');
  const [checkOutFinalElec, setCheckOutFinalElec] = useState('');
  const [checkOutCleaningFee, setCheckOutCleaningFee] = useState('500');
  const [checkOutRepairFee, setCheckOutRepairFee] = useState('0');
  const [checkOutOtherDeductions, setCheckOutOtherDeductions] = useState('0');
  const [checkOutKeycardsReturned, setCheckOutKeycardsReturned] = useState('0');
  const [checkOutNote, setCheckOutNote] = useState('');
  const [checkOutNoticeDate, setCheckOutNoticeDate] = useState('');
  const [checkOutOverrideForfeit, setCheckOutOverrideForfeit] = useState(false);
  const [checkOutActionType, setCheckOutActionType] = useState<'RECORD_NOTICE_ONLY' | 'FINAL_CHECKOUT'>('RECORD_NOTICE_ONLY');
  const [checkOutRefundProratedRent, setCheckOutRefundProratedRent] = useState(false);
  const [checkOutReceiptData, setCheckOutReceiptData] = useState<any>(null);
  const [showCheckOutReceiptModal, setShowCheckOutReceiptModal] = useState(false);
  const [isScanningIdCard, setIsScanningIdCard] = useState(false);

  // Booking inputs state
  const [bookingMode, setBookingMode] = useState<'EXPRESS' | 'FULL'>('EXPRESS');
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingIdCard, setBookingIdCard] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingLineId, setBookingLineId] = useState('');
  const [bookingCheckInDate, setBookingCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingDeposit, setBookingDeposit] = useState('');
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('CASH');
  const [bookingSlipImage, setBookingSlipImage] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  // Meter inputs state
  const [meterPeriod, setMeterPeriod] = useState(getPayInAdvanceBillingPeriod(new Date())); // YYYY-MM (defaults to next month)
  const [waterReadings, setWaterReadings] = useState<{ [roomId: string]: string }>({});
  const [elecReadings, setElecReadings] = useState<{ [roomId: string]: string }>({});
  const [meterErrors, setMeterErrors] = useState<{ [roomId: string]: string }>({});
  const [meterStatus, setMeterStatus] = useState<string>('');

  // Invoice generator inputs
  const [invoicePeriod, setInvoicePeriod] = useState(() => getPayInAdvanceBillingPeriod(new Date()));
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceOtherCost, setInvoiceOtherCost] = useState('0');
  const [customWaterCostInput, setCustomWaterCostInput] = useState('0');
  const [customElecCostInput, setCustomElecCostInput] = useState('0');
  const [modalWaterType, setModalWaterType] = useState('METER');
  const [modalElecType, setModalElecType] = useState('METER');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoiceOtherFeeItems, setInvoiceOtherFeeItems] = useState<{ id: string; name: string; amount: string }[]>([
    { id: '1', name: '', amount: '' }
  ]);
  const [invoiceCustomNote, setInvoiceCustomNote] = useState('');
  const [invoiceBookNo, setInvoiceBookNo] = useState('');
  const [invoiceNoStr, setInvoiceNoStr] = useState('');
  const [showInvoiceQr, setShowInvoiceQr] = useState(false);
  
  // Rich Invoices Filters state
  const [invoiceFilterPeriod, setInvoiceFilterPeriod] = useState<string>(() => getPayInAdvanceBillingPeriod(new Date()));
  const [invoiceFilterBuildingId, setInvoiceFilterBuildingId] = useState<string>('ALL');

  // Edit Invoice Modal state
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState('');
  const [editPrevWater, setEditPrevWater] = useState('');
  const [editCurWater, setEditCurWater] = useState('');
  const [editWaterRate, setEditWaterRate] = useState('');
  const [editPrevElec, setEditPrevElec] = useState('');
  const [editCurElec, setEditCurElec] = useState('');
  const [editElecRate, setEditElecRate] = useState('');
  const [editRentCost, setEditRentCost] = useState('');
  const [editOtherFeeItems, setEditOtherFeeItems] = useState<{ id: string; name: string; amount: string }[]>([]);
  const [editOtherNote, setEditOtherNote] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('UNPAID');
  
  // Payment recorder inputs
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [paymentReceiverName, setPaymentReceiverName] = useState('');
  const [paymentSlipImage, setPaymentSlipImage] = useState('');
  
  // A5 Print Mode: 'invoice' | 'receipt'
  const [activePrintTab, setActivePrintTab] = useState<'invoice' | 'receipt'>('invoice');
  // Property settings states
  const [property, setProperty] = useState<any>(null);
  const [propName, setPropName] = useState('');
  const [propPhone, setPropPhone] = useState('');
  const [propEmail, setPropEmail] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propLineId, setPropLineId] = useState('');
  const [propGeminiApiKey, setPropGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  // Building filter for Overview dashboard
  const [overviewBuildingFilter, setOverviewBuildingFilter] = useState<string>('ALL');
  
  // Overdue/Unpaid popup states
  const [showOverdueModal, setShowOverdueModal] = useState<boolean>(false);
  const [overdueBuildingFilter, setOverdueBuildingFilter] = useState<string>('ALL');

  // Chart interactivity states
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [chartViewMode, setChartViewMode] = useState<'status' | 'type'>('status');

  // Search query states
  const [meterSearchQuery, setMeterSearchQuery] = useState('');
  const [meterStatusFilter, setMeterStatusFilter] = useState<string>('OCCUPIED');
  const [meterEntryMode, setMeterEntryMode] = useState<'BOTH' | 'WATER' | 'ELEC'>('BOTH');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // --- Bulk Bill Generation State ---
  const [showBulkBillModal, setShowBulkBillModal] = useState(false);
  const [bulkBillPeriod, setBulkBillPeriod] = useState(() => getPayInAdvanceBillingPeriod(new Date()));
  const [bulkBillDueDate, setBulkBillDueDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-05`;
  });
  const [bulkRoomList, setBulkRoomList] = useState<any[]>([]);
  const [bulkRoomLoading, setBulkRoomLoading] = useState(false);
  const [bulkExtraFees, setBulkExtraFees] = useState<Record<string, { name: string; amount: string }[]>>({});
  const [bulkBuildingFilter, setBulkBuildingFilter] = useState<string>('ALL');
  const [bulkStatusFilter, setBulkStatusFilter] = useState<'ALL' | 'UNPAID_ONLY' | 'PAID_ONLY'>('ALL');
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  // --- Tenants Directory States ---
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [tenantBuildingFilter, setTenantBuildingFilter] = useState('ALL');
  const [tenantStatusTab, setTenantStatusTab] = useState<'ACTIVE' | 'MOVED_OUT'>('ACTIVE');

  // Edit Tenant Modal state
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [editTenantName, setEditTenantName] = useState('');
  const [editTenantPhone, setEditTenantPhone] = useState('');
  const [editTenantIdCard, setEditTenantIdCard] = useState('');
  const [editTenantEmail, setEditTenantEmail] = useState('');
  const [editTenantLineId, setEditTenantLineId] = useState('');
  const [editTenantAddress, setEditTenantAddress] = useState('');
  const [editTenantWorkplace, setEditTenantWorkplace] = useState('');
  const [editTenantEmergencyName, setEditTenantEmergencyName] = useState('');
  const [editTenantEmergencyRel, setEditTenantEmergencyRel] = useState('');
  const [editTenantEmergencyPhone, setEditTenantEmergencyPhone] = useState('');
  const [editTenantNote, setEditTenantNote] = useState('');
  const [editTenantStartDate, setEditTenantStartDate] = useState('');
  const [editTenantSaving, setEditTenantSaving] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);


  // --- A5 Print via Pop-up window (clean A5 document per room) ---
  const handlePrintA5 = () => {
    const el = document.querySelector('.a5-printable-card');
    if (!el) return;
    const printWindow = window.open('', '_blank', 'width=600,height=850');
    if (!printWindow) { alert('กรุณาอนุญาตป๊อปอัพเพื่อพิมพ์เอกสาร'); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>พิมพ์เอกสาร A5</title>
<style>
@page { size: A5 portrait; margin: 4mm; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: 'Sarabun', 'TH Sarabun New', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
table { border-collapse: collapse; }
</style>
</head><body>${el.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.focus(); printWindow.print(); printWindow.close(); };
  };

  // --- Multi-Page A5 Batch Print (1 A5 document page per room) ---
  const handleBatchPrintA5List = (
    invoiceList: any[],
    mode: 'INVOICE_ONLY' | 'RECEIPT_ONLY' | 'ALL_GROUPED' = 'INVOICE_ONLY',
    includeQr: boolean = true
  ) => {
    if (!invoiceList || invoiceList.length === 0) {
      alert('ไม่มีรายการใบแจ้งหนี้/ใบเสร็จในระบบตามเงื่อนไขที่เลือก');
      return;
    }

    // Determine target items to print
    let targetItems: { inv: any; type: 'invoice' | 'receipt' }[] = [];

    if (mode === 'INVOICE_ONLY') {
      targetItems = invoiceList.map(inv => ({ inv, type: 'invoice' }));
    } else if (mode === 'RECEIPT_ONLY') {
      const paidInvoices = invoiceList.filter(inv => inv.status === 'PAID');
      if (paidInvoices.length === 0) {
        alert('ไม่พบใบเสร็จรับเงิน (ไม่มีรายการที่ชำระเงินเรียบร้อยแล้วในรอบบิล/อาคารที่เลือก)');
        return;
      }
      targetItems = paidInvoices.map(inv => ({ inv, type: 'receipt' }));
    } else {
      // ALL_GROUPED: Group 1 = All Invoices first (for room delivery), Group 2 = Paid Receipts after
      const invoicesGroup = invoiceList.map(inv => ({ inv, type: 'invoice' as const }));
      const receiptsGroup = invoiceList.filter(inv => inv.status === 'PAID').map(inv => ({ inv, type: 'receipt' as const }));
      targetItems = [...invoicesGroup, ...receiptsGroup];
    }

    if (targetItems.length === 0) {
      alert('ไม่มีรายการที่จะพิมพ์');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('กรุณาอนุญาตป๊อปอัพเพื่อพิมพ์เอกสาร');
      return;
    }

    const cardsHtml = targetItems.map((item, index) => {
      const { inv, type } = item;
      let otherItemsHtml = '';
      let parsedItems: any[] = [];
      if (inv.otherFeeDetails) {
        try { parsedItems = JSON.parse(inv.otherFeeDetails); } catch (e) { parsedItems = []; }
      }

      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        otherItemsHtml = parsedItems.map(i => `
          <tr style="height: 26px;">
            <td style="border-right: 1px solid #000000; padding: 4px 10px;">${i.name || 'ค่าใช้จ่ายอื่นๆ'}</td>
            <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">-</td>
            <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">-</td>
            <td style="padding: 4px 10px; text-align: right; font-weight: 500;">${(i.amount || 0).toLocaleString()}</td>
          </tr>
        `).join('');
      } else if (inv.otherCost > 0) {
        otherItemsHtml = `
          <tr style="height: 26px;">
            <td style="border-right: 1px solid #000000; padding: 4px 10px;">ค่าใช้จ่ายอื่นๆ</td>
            <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">-</td>
            <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">-</td>
            <td style="padding: 4px 10px; text-align: right; font-weight: 500;">${inv.otherCost.toLocaleString()}</td>
          </tr>
        `;
      }

      const waterUnits = Math.max(0, (inv.currentWater || 0) - (inv.previousWater || 0));
      const waterRateStr = inv.room?.waterBillingType === 'FLAT'
        ? 'เหมาจ่าย'
        : (inv.waterRate ?? (inv.waterCost > 0 && waterUnits > 0 ? inv.waterCost / waterUnits : inv.room?.floor?.building?.waterRate || 18));

      const elecUnits = Math.max(0, (inv.currentElec || 0) - (inv.previousElec || 0));
      const elecRateStr = inv.room?.elecBillingType === 'FLAT'
        ? 'เหมาจ่าย'
        : (inv.electricityRate ?? (inv.electricityCost > 0 && elecUnits > 0 ? inv.electricityCost / elecUnits : inv.room?.floor?.building?.electricityRate || 7));

      const isReceipt = type === 'receipt';
      const docTitle = isReceipt ? 'ใบเสร็จรับเงิน' : 'ใบแจ้งหนี้';

      const isLast = index === targetItems.length - 1;
      const pageBreakStyle = isLast ? '' : 'page-break-after: always; break-after: page;';
      const bObj = inv.room?.floor?.building;
      const qrImgUrl = bObj?.promptPayQrUrl || (bObj?.promptPayId ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(bObj.promptPayId)}` : null);
      const accName = bObj?.promptPayName || bObj?.name || 'ธารทิพย์ อพาร์ทเมนท์';

      const qrBlock = (!isReceipt && includeQr) ? `
        <!-- PromptPay QR Code Box -->
        <div style="margin-top: 8px; padding: 6px 12px; border: 1px dashed #aaaaaa; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; background-color: #fafafa;">
          <div style="font-size: 11px; color: #333333;">
            <div style="font-weight: bold; font-size: 12px; color: #000000;">📲 สแกนชำระเงินด้วย PromptPay</div>
            <div>ยอดชำระ: <strong>${(inv.totalAmount || 0).toLocaleString()} บาท</strong></div>
            <div>ชื่อบัญชี: <strong>${accName}</strong></div>
            ${bObj?.promptPayId ? `<div>เลข PromptPay: <strong>${bObj.promptPayId}</strong></div>` : ''}
          </div>
          ${qrImgUrl ? `<img src="${qrImgUrl}" style="width: 65px; height: 65px; object-fit: contain; border: 1px solid #cccccc; background: #fff;" />` : ''}
        </div>
      ` : '';

      const receiverBlock = isReceipt ? `
        <!-- Receiver Section (ผู้รับเงินเฉพาะใบเสร็จรับเงิน) -->
        <div style="margin-top: 20px; margin-bottom: 10px; display: flex; justify-content: flex-end; font-size: 13px;">
          <div style="text-align: center; min-width: 320px;">
            <strong>ผู้รับเงิน</strong> ....................................................................................
            <div style="font-size: 12px; margin-top: 2px; color: #555555;">
              ( ลงชื่อผู้รับเงิน )
            </div>
          </div>
        </div>
      ` : '';

      return `
        <div class="a5-printable-card" style="
          background-color: #ffffff;
          color: #000000;
          padding: 16px 20px;
          border: 1.5px solid #000000;
          border-radius: 2px;
          font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
          line-height: 1.4;
          margin: 0 auto ${isLast ? '0' : '20px'} auto;
          max-width: 720px;
          ${pageBreakStyle}
        ">
          <!-- Top Header: Book No. & Invoice No. -->
          <div style="display: flex; justify-content: flex-end; gap: 3rem; font-size: 13px; font-weight: bold; margin-bottom: 4px;">
            <span>เล่มที่ : ${inv.bookNo || inv.room?.number}</span>
            <span>เลขที่ : ${inv.invoiceNoStr || '1'}</span>
          </div>

          <!-- Black Title Banner -->
          <div style="background-color: #000000; color: #ffffff; text-align: center; font-weight: bold; font-size: 18px; padding: 4px 0; letter-spacing: 2px; margin-bottom: 14px;">
            ${docTitle}
          </div>

          <!-- Property Header Box -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <div style="border: 1.5px solid #000000; padding: 6px 14px; text-align: center; min-width: 260px; font-size: 12px; line-height: 1.35;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">
                ${inv.room?.floor?.building?.name || 'SmartApart'}
              </div>
              <div>
                ${inv.room?.floor?.building?.address || '7/6 ถ.พลเวียง ต.นางรอง อ.นางรอง จ.บุรีรัมย์ 31110'}
              </div>
              <div>
                โทร. ${inv.room?.floor?.building?.phone || '096-2624963, 044-633888'}
              </div>
            </div>
          </div>

          <!-- Details Lines -->
          <div style="font-size: 13px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; align-items: center;">
              <div><strong style="width: 55px; display: inline-block;">วันที่ :</strong> ${formatThaiDateLong(inv.createdAt)}</div>
              <div style="margin-right: 40px; white-space: nowrap;"><strong style="display: inline-block;">ประจำเดือน :</strong> ${formatThaiMonthOnly(inv.billingPeriod)}</div>
            </div>
            <div style="margin-bottom: 4px;">
              <strong style="width: 55px; display: inline-block;">ผู้เช่า :</strong> ${inv.tenant?.name || '-'}
            </div>
            <div>
              <strong style="width: 55px; display: inline-block;">ที่อยู่ :</strong> ห้อง ${inv.room?.number || ''} ${(inv.room?.floor?.building?.address || '').replace(/^[0-9\/]+\s*/, '')}
            </div>
          </div>

          <!-- Itemized Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1.5px solid #000000; margin-bottom: 12px;">
            <thead>
              <tr style="border-bottom: 1.5px solid #000000; background-color: #f2f2f2;">
                <th style="border-right: 1px solid #000000; padding: 5px 8px; text-align: center; font-weight: bold;">รายการ</th>
                <th style="border-right: 1px solid #000000; padding: 5px 8px; text-align: center; font-weight: bold; width: 55px;">หน่วยละ</th>
                <th style="border-right: 1px solid #000000; padding: 5px 8px; text-align: center; font-weight: bold; width: 45px;">ใช้ไป</th>
                <th style="padding: 5px 8px; text-align: center; font-weight: bold; width: 100px;">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              ${inv.rentCost > 0 ? `
              <tr style="height: 26px;">
                <td style="border-right: 1px solid #000000; padding: 4px 10px;">ค่าเช่าเดือน${formatThaiMonthOnly(inv.billingPeriod)}</td>
                <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">-</td>
                <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">-</td>
                <td style="padding: 4px 10px; text-align: right; font-weight: 500;">${(inv.rentCost || 0).toLocaleString()}</td>
              </tr>` : ''}

              <tr style="height: 26px;">
                <td style="border-right: 1px solid #000000; padding: 4px 10px;">
                  ค่าน้ำ <span style="margin-left: 40px;">( ${inv.previousWater || 0} - ${inv.currentWater || 0} )</span>
                </td>
                <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">${waterRateStr}</td>
                <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">${waterUnits}</td>
                <td style="padding: 4px 10px; text-align: right; font-weight: 500;">${(inv.waterCost || 0).toLocaleString()}</td>
              </tr>

              <tr style="height: 26px;">
                <td style="border-right: 1px solid #000000; padding: 4px 10px;">
                  ค่าไฟ <span style="margin-left: 40px;">( ${inv.previousElec || 0} - ${inv.currentElec || 0} )</span>
                </td>
                <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">${elecRateStr}</td>
                <td style="border-right: 1px solid #000000; padding: 4px 8px; text-align: center;">${elecUnits}</td>
                <td style="padding: 4px 10px; text-align: right; font-weight: 500;">${(inv.electricityCost || 0).toLocaleString()}</td>
              </tr>

              ${otherItemsHtml}

              <tr style="border-top: 1.5px solid #000000; font-weight: bold;">
                <td colSpan="3" style="border-right: 1px solid #000000; padding: 6px 12px; text-align: right;">
                  รวมเงิน (Total)
                </td>
                <td style="padding: 6px 10px; text-align: right; font-size: 14px;">
                  ${(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          ${receiverBlock}

          <!-- Bottom Note -->
          <div style="font-size: 12.5px; margin-top: ${isReceipt ? '6px' : '18px'}; min-height: 24px;">
            <strong>*** หมายเหตุ :</strong> ${inv.otherNote || ''}
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>พิมพ์ใบแจ้งหนี้ / ใบเสร็จรับเงิน A5</title>
<style>
@page { size: A5 portrait; margin: 4mm; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: 'Sarabun', 'TH Sarabun New', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
table { border-collapse: collapse; }
@media print {
  .a5-printable-card {
    page-break-after: always;
    break-after: page;
    box-shadow: none !important;
  }
}
</style>
<script>
  window.addEventListener('afterprint', function() {
    window.close();
  });
</script>
</head><body>${cardsHtml}</body></html>`);

    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error(e);
      }
    }, 300);
  };

  // --- Bulk Bill: Fetch eligible rooms for a billing period ---
  const fetchBulkRooms = async (period: string) => {
    setBulkRoomLoading(true);
    setBulkRoomList([]);
    setBulkExtraFees({});
    setBulkResult(null);
    try {
      const res = await fetch(`/api/invoices/bulk?billingPeriod=${period}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setBulkRoomList(data);
        // Init empty extra fee slots for rooms without invoice yet
        const init: Record<string, { name: string; amount: string }[]> = {};
        data.filter((r: any) => !r.hasInvoice && r.hasMeter).forEach((r: any) => {
          init[r.roomId] = [{ name: '', amount: '' }];
        });
        setBulkExtraFees(init);
      }
    } catch {
      alert('ไม่สามารถโหลดข้อมูลห้องได้');
    }
    setBulkRoomLoading(false);
  };

  // --- Bulk Bill: Update extra fee row ---
  const updateBulkFee = (roomId: string, idx: number, field: 'name' | 'amount', value: string) => {
    setBulkExtraFees(prev => {
      const rows = [...(prev[roomId] || [{ name: '', amount: '' }])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, [roomId]: rows };
    });
  };

  const addBulkFeeRow = (roomId: string) => {
    setBulkExtraFees(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), { name: '', amount: '' }],
    }));
  };

  const removeBulkFeeRow = (roomId: string, idx: number) => {
    setBulkExtraFees(prev => {
      const rows = [...(prev[roomId] || [])];
      rows.splice(idx, 1);
      return { ...prev, [roomId]: rows.length > 0 ? rows : [{ name: '', amount: '' }] };
    });
  };

  // --- Bulk Bill: Generate all bills ---
  const handleBulkGenerate = async () => {
    const filteredList = bulkRoomList.filter(r => bulkBuildingFilter === 'ALL' || r.buildingId === bulkBuildingFilter);
    const eligible = filteredList.filter(r => !r.hasInvoice && r.hasMeter);
    if (eligible.length === 0) {
      alert('ไม่มีห้องที่พร้อมออกบิล (ต้องมีมิเตอร์และยังไม่มีบิลในรอบนี้)');
      return;
    }
    if (!bulkBillDueDate) {
      alert('กรุณาระบุวันที่ครบกำหนดชำระ');
      return;
    }
    if (!confirm(`ยืนยันออกบิล ${eligible.length} ห้อง สำหรับรอบ ${bulkBillPeriod} ?`)) return;

    setBulkGenerating(true);
    try {
      const rooms = eligible.map(r => {
        const feeRows = (bulkExtraFees[r.roomId] || []).filter(f => f.name && parseFloat(f.amount) > 0);
        return {
          roomId: r.roomId,
          otherFeeItems: feeRows.map(f => ({ name: f.name, amount: parseFloat(f.amount) })),
        };
      });

      const res = await fetch('/api/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingPeriod: bulkBillPeriod, dueDate: bulkBillDueDate, rooms }),
      });
      const data = await res.json();
      setBulkResult(data);
      // Refresh invoice list
      const invRes = await fetch('/api/invoices');
      if (invRes.ok) setInvoices(await invRes.json());
      // Refresh room list
      await fetchBulkRooms(bulkBillPeriod);
    } catch {
      alert('เกิดข้อผิดพลาดในการออกบิล');
    }
    setBulkGenerating(false);
  };


  useEffect(() => {
    async function initData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setAdminUser(meData.user);

        // Fetch buildings, global stats & settings
        await refreshDashboardData();
        await refreshInvoices();
        await refreshTenants();
        await refreshPropertyData();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [router]);

  async function refreshDashboardData() {
    const res = await fetch(`/api/buildings?period=${meterPeriod}`);
    if (res.ok) {
      const data = await res.json();
      setBuildings(data.buildings);
      setStats(data.stats);
      if (data.buildings.length > 0) {
        if (!selectedBuildingId) setSelectedBuildingId(data.buildings[0].id);
        if (!settingsBuildingId) setSettingsBuildingId(data.buildings[0].id);
      }
    }
  }

  useEffect(() => {
    refreshDashboardData();
  }, [meterPeriod]);

  async function refreshInvoices() {
    const res = await fetch('/api/invoices');
    if (res.ok) {
      const data = await res.json();
      setInvoices(data);
    }
  }

  async function refreshTenants() {
    setTenantsLoading(true);
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenantsList(data);
      }
    } catch (e) {
      console.error('Failed to fetch tenants:', e);
    } finally {
      setTenantsLoading(false);
    }
  }

  const handleOpenEditTenantModal = (tenant: any) => {
    setEditingTenant(tenant);
    setEditTenantName(tenant.name || '');
    setEditTenantPhone(tenant.phone || '');
    setEditTenantIdCard(tenant.idCard || '');
    setEditTenantEmail(tenant.email || '');
    setEditTenantLineId(tenant.lineId || '');
    setEditTenantAddress(tenant.address || '');
    setEditTenantWorkplace(tenant.workplace || '');
    setEditTenantEmergencyName(tenant.emergencyName || '');
    setEditTenantEmergencyRel(tenant.emergencyRel || '');
    setEditTenantEmergencyPhone(tenant.emergencyPhone || '');
    setEditTenantNote(tenant.note || '');
    setEditTenantStartDate(tenant.startDate ? new Date(tenant.startDate).toISOString().split('T')[0] : '');
    setShowEditTenantModal(true);
  };

  const handleSaveTenantInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setEditTenantSaving(true);
    try {
      const res = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTenantName,
          phone: editTenantPhone,
          idCard: editTenantIdCard,
          email: editTenantEmail,
          lineId: editTenantLineId,
          address: editTenantAddress,
          workplace: editTenantWorkplace,
          emergencyName: editTenantEmergencyName,
          emergencyRel: editTenantEmergencyRel,
          emergencyPhone: editTenantEmergencyPhone,
          note: editTenantNote,
          startDate: editTenantStartDate,
        }),
      });

      if (res.ok) {
        setShowEditTenantModal(false);
        await refreshTenants();
        await refreshDashboardData();
        alert('อัปเดตข้อมูลส่วนตัวผู้เช่าเรียบร้อยแล้ว');
      } else {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.error || 'ไม่สามารถบันทึกได้'}`);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setEditTenantSaving(false);
    }
  };

  const handleCancelCheckIn = async (tenantId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเข้าพักนี้?\n\nข้อมูลผู้เช่า บิลแรกเข้า และมิเตอร์จะถูกลบออกจากระบบ และห้องจะกลับเป็นสถานะ "ว่าง" 100%')) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'ยกเลิกการเข้าพักสำเร็จ');
        setShowRoomModal(false);
        setShowEditTenantModal(false);
        refreshDashboardData();
        refreshInvoices();
        refreshTenants();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการยกเลิกการเข้าพัก');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleOpenRoomTransferModal = (room: any) => {
    setSelectedRoom(room);
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = async (data: any) => {
    if (!selectedRoom || !selectedRoom.tenants?.[0]) return;
    const tenantId = selectedRoom.tenants[0].id;
    const res = await fetch(`/api/tenants/${tenantId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      alert('ทำรายการย้ายห้องพักสำเร็จเรียบร้อยแล้ว!');
      setShowTransferModal(false);
      setShowRoomModal(false);
      refreshDashboardData();
      refreshTenants();
      refreshInvoices();
    } else {
      throw new Error(result.error || 'เกิดข้อผิดพลาดในการย้ายห้องพัก');
    }
  };

  async function refreshPropertyData() {
    const res = await fetch('/api/property');
    if (res.ok) {
      const data = await res.json();
      setProperty(data);
      setPropName(data.name || '');
      setPropPhone(data.phone || '');
      setPropEmail(data.email || '');
      setPropAddress(data.address || '');
      setPropLineId(data.lineId || '');
      setPropGeminiApiKey(data.geminiApiKey || '');
    }
  }

  // Thai date formatting
  const getThaiBuddhistDate = () => {
    const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const date = new Date();
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const yearBE = date.getFullYear() + 543;
    return `${dayName}ที่ ${dayNum} ${monthName} ${yearBE}`;
  };

  // Dynamic stats based on building filter
  const getFilteredStats = () => {
    if (!stats || !buildings) return null;

    if (overviewBuildingFilter === 'ALL') {
      return stats;
    }

    const building = buildings.find(b => b.id === overviewBuildingFilter);
    if (!building) return stats;

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Sum from building specific rooms
    let totalRooms = building.stats.total;
    let occupiedRooms = building.stats.occupied;
    let vacantRooms = building.stats.vacant;
    let maintenanceRooms = building.stats.maintenance;

    // Filter invoices related to this building
    const buildingInvoices = invoices.filter(inv => inv.room.floor.buildingId === building.id);

    const currentMonthRevenue = buildingInvoices
      .filter((inv) => inv.status === 'PAID' && inv.billingPeriod === currentMonth)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const totalUnpaidAmount = buildingInvoices
      .filter((inv) => inv.status === 'UNPAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const unpaidRoomIds = new Set(
      buildingInvoices.filter((inv) => inv.status === 'UNPAID').map((inv) => inv.roomId)
    );
    const unpaidRoomsCount = unpaidRoomIds.size;

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      unpaidRoomsCount,
      currentMonthRevenue,
      totalUnpaidAmount,
      occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    };
  };

  const activeStats = getFilteredStats();


  // Pre-calculate due date (usually 5th of next month)
  useEffect(() => {
    const [year, month] = invoicePeriod.split('-').map(Number);
    // Setting due date to the 5th of the NEXT month
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const monthStr = nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
    setInvoiceDueDate(`${nextYear}-${monthStr}-05`);
  }, [invoicePeriod]);

  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    }
  };

  const handleRoomClick = async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (res.ok) {
      const roomData = await res.json();
      setSelectedRoom(roomData);
      setModalWaterType(roomData.waterBillingType || 'METER');
      setModalElecType(roomData.elecBillingType || 'METER');
      setShowRoomModal(true);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: checkInName,
          phone: checkInPhone,
          idCard: checkInIdCard,
          address: checkInAddress,
          email: checkInEmail,
          lineId: checkInLineId,
          workplace: checkInWorkplace,
          emergencyName: checkInEmergencyName,
          emergencyRel: checkInEmergencyRel,
          emergencyPhone: checkInEmergencyPhone,
          securityDeposit: checkInSecurityDeposit ? parseFloat(checkInSecurityDeposit) : 0,
          keycardCount: checkInKeycardCount ? parseInt(checkInKeycardCount) : 0,
          keycardDeposit: checkInKeycardDeposit ? parseFloat(checkInKeycardDeposit) : 0,
          keycardCode: checkInKeycardCode,
          note: checkInNote,
          startDate: checkInDate,
          roomId: selectedRoom.id,
          startingWaterMeter: checkInWaterMeter ? parseFloat(checkInWaterMeter) : undefined,
          startingElecMeter: checkInElecMeter ? parseFloat(checkInElecMeter) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCheckInModal(false);
        // Clear inputs
        setCheckInName('');
        setCheckInPhone('');
        setCheckInIdCard('');
        setCheckInAddress('');
        setCheckInEmail('');
        setCheckInLineId('');
        setCheckInWorkplace('');
        setCheckInEmergencyName('');
        setCheckInEmergencyRel('');
        setCheckInEmergencyPhone('');
        setCheckInSecurityDeposit('');
        setCheckInUseKeycard(false);
        setCheckInKeycardCount('0');
        setCheckInKeycardDeposit('0');
        setCheckInKeycardCode('');
        setCheckInNote('');
        setCheckInWaterMeter('');
        setCheckInElecMeter('');

        // Auto switch period filter if first invoice period is different (e.g. August for Rule 1.3)
        if (data.firstInvoicePeriod) {
          setInvoicePeriod(data.firstInvoicePeriod);
          setMeterPeriod(data.firstInvoicePeriod);
        }

        // Refresh detail & active views
        handleRoomClick(selectedRoom.id);
        refreshInvoices();
        refreshDashboardData();

        // Auto open newly generated first invoice modal so landlord can view/print bill!
        if (data.firstInvoiceId) {
          alert(`ลงทะเบียนผู้เช่าเรียบร้อยแล้ว! ระบบสร้างใบแจ้งหนี้ใบแรกประจำเดือน ${formatThaiBillingPeriod(data.firstInvoicePeriod || checkInDate.slice(0, 7))} ให้อัตโนมัติ`);
          handleInvoiceClick(data.firstInvoiceId);
        } else {
          alert('ลงทะเบียนผู้เช่าเรียบร้อยแล้ว');
        }
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          customerName: bookingName,
          customerPhone: bookingPhone,
          customerIdCard: bookingIdCard,
          customerEmail: bookingEmail,
          customerLineId: bookingLineId,
          expectedCheckInDate: bookingCheckInDate,
          depositAmount: bookingDeposit,
          paymentMethod: bookingPaymentMethod,
          slipImage: bookingSlipImage,
          note: bookingNote,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('บันทึกการจองห้องพักสำเร็จ');
        setShowBookingModal(false);
        setBookingName('');
        setBookingPhone('');
        setBookingIdCard('');
        setBookingEmail('');
        setBookingLineId('');
        setBookingDeposit('');
        setBookingNote('');
        setBookingSlipImage('');
        handleRoomClick(selectedRoom.id);
        refreshDashboardData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกการจอง');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleBookingCheckInSubmit = async (bookingId: string) => {
    if (!selectedRoom) return;
    try {
      const latestReading = selectedRoom.readings?.[0];
      const waterVal = latestReading ? latestReading.waterValue : (selectedRoom.currentWater ?? selectedRoom.prevWater ?? 0);
      const elecVal = latestReading ? latestReading.electricityValue : (selectedRoom.currentElec ?? selectedRoom.prevElec ?? 0);

      const res = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date().toISOString().split('T')[0],
          startingWaterMeter: waterVal,
          startingElecMeter: elecVal,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('ทำสัญญาเช่าจากรายการจองสำเร็จ');
        handleRoomClick(selectedRoom.id);
        refreshDashboardData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการทำสัญญา');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleBookingCancel = async (bookingId: string, action: 'REFUND' | 'FORFEIT') => {
    const actionText = action === 'REFUND' ? 'คืนเงินมัดจำ' : 'ริบเงินมัดจำ';
    if (!confirm(`ยืนยันการยกเลิกการจองห้องพัก (${actionText}) ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('ยกเลิกการจองเรียบร้อยแล้ว');
        handleRoomClick(selectedRoom.id);
        refreshDashboardData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการยกเลิกการจอง');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleOpenCheckOutModal = (tenant: any) => {
    setActiveCheckOutTenant(tenant);
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Set default notice date & expected checkout date
    const existingNotice = tenant.noticeDate ? new Date(tenant.noticeDate).toISOString().split('T')[0] : todayStr;
    setCheckOutNoticeDate(existingNotice);

    let defaultOutDate = todayStr;
    if (tenant.expectedCheckOutDate) {
      defaultOutDate = new Date(tenant.expectedCheckOutDate).toISOString().split('T')[0];
    } else {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      defaultOutDate = nextMonth.toISOString().split('T')[0];
    }
    setCheckOutDate(defaultOutDate);

    // If already has notice, default to FINAL_CHECKOUT mode; otherwise RECORD_NOTICE_ONLY
    setCheckOutActionType(tenant.noticeDate || tenant.expectedCheckOutDate ? 'FINAL_CHECKOUT' : 'RECORD_NOTICE_ONLY');
    setCheckOutRefundProratedRent(false);
    setCheckOutOverrideForfeit(false);

    const latestWater = selectedRoom?.currentWater ?? selectedRoom?.prevWater ?? 0;
    const latestElec = selectedRoom?.currentElec ?? selectedRoom?.prevElec ?? 0;
    setCheckOutFinalWater(latestWater ? String(latestWater) : '');
    setCheckOutFinalElec(latestElec ? String(latestElec) : '');
    setCheckOutCleaningFee('500');
    setCheckOutRepairFee('0');
    setCheckOutOtherDeductions('0');
    setCheckOutKeycardsReturned(String(tenant.keycardCount || 0));
    setCheckOutNote('');
    setShowRoomModal(false);
    setShowCheckOutModal(true);
  };

  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckOutTenant || !selectedRoom) return;

    try {
      // 📌 MODE 1: Record Notice Only (ยังไม่คืนห้อง)
      if (checkOutActionType === 'RECORD_NOTICE_ONLY') {
        const res = await fetch(`/api/tenants/${activeCheckOutTenant.id}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionType: 'RECORD_NOTICE_ONLY',
            noticeDate: checkOutNoticeDate,
            expectedCheckOutDate: checkOutDate,
            note: checkOutNote,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setShowCheckOutModal(false);
          alert(`📌 บันทึกการแจ้งย้ายออกล่วงหน้าของห้อง ${selectedRoom.number} เรียบร้อยแล้ว!\n(ห้องพักยังคงเปิดใช้งาน และจะขึ้นป้ายเตือนสำหรับเปิดรับจองล่วงหน้า)`);
          await refreshDashboardData();
          await refreshTenants();
        } else {
          alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกแจ้งย้ายออก');
        }
        return;
      }

      // 🏁 MODE 2: Final Check-Out & Deposit Refund Settlement
      // Calculate prorated rent refund if enabled
      let proratedRefundAmount = 0;
      if (checkOutRefundProratedRent && selectedRoom) {
        const outD = new Date(checkOutDate);
        const daysInMonth = new Date(outD.getFullYear(), outD.getMonth() + 1, 0).getDate();
        const currentDay = outD.getDate();
        const remainingDays = Math.max(0, daysInMonth - currentDay);
        const dailyRent = (selectedRoom.basePrice || 0) / daysInMonth;
        proratedRefundAmount = Math.round(dailyRent * remainingDays);
      }

      const res = await fetch(`/api/tenants/${activeCheckOutTenant.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'FINAL_CHECKOUT',
          checkOutDate,
          noticeDate: checkOutNoticeDate,
          overrideForfeitDeposit: checkOutOverrideForfeit,
          finalWaterValue: checkOutFinalWater,
          finalElecValue: checkOutFinalElec,
          cleaningFee: checkOutCleaningFee,
          repairFee: checkOutRepairFee,
          otherDeductions: checkOutOtherDeductions,
          keycardsReturned: checkOutKeycardsReturned,
          refundProratedRent: checkOutRefundProratedRent,
          proratedRefundAmount,
          note: checkOutNote,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCheckOutModal(false);

        // Calculate summary for printable receipt
        const waterRate = selectedRoom.floor?.building?.waterRate || 18;
        const elecRate = selectedRoom.floor?.building?.electricityRate || 8;
        const prevWater = selectedRoom.prevWater || 0;
        const prevElec = selectedRoom.prevElec || 0;
        const finalWaterNum = checkOutFinalWater ? parseFloat(checkOutFinalWater) : prevWater;
        const finalElecNum = checkOutFinalElec ? parseFloat(checkOutFinalElec) : prevElec;
        const waterUnits = Math.max(0, finalWaterNum - prevWater);
        const elecUnits = Math.max(0, finalElecNum - prevElec);
        const waterCost = waterUnits * waterRate;
        const elecCost = elecUnits * elecRate;

        const secDeposit = data.summary?.securityDeposit !== undefined ? data.summary.securityDeposit : (activeCheckOutTenant.securityDeposit || 0);
        const kcCount = activeCheckOutTenant.keycardCount || 0;
        const kcDeposit = activeCheckOutTenant.keycardDeposit || 0;
        const kcReturned = parseInt(checkOutKeycardsReturned || '0');
        const kcRefund = kcCount > 0 ? (kcReturned / kcCount) * kcDeposit : 0;
        const cleanFee = parseFloat(checkOutCleaningFee || '0');
        const repFee = parseFloat(checkOutRepairFee || '0');
        const othDed = parseFloat(checkOutOtherDeductions || '0');

        const totalRefundable = secDeposit + kcRefund + proratedRefundAmount;
        const totalDeductions = waterCost + elecCost + cleanFee + repFee + othDed;
        const netRefund = totalRefundable - totalDeductions;

        setCheckOutReceiptData({
          roomNumber: selectedRoom.number,
          tenantName: activeCheckOutTenant.name,
          tenantPhone: activeCheckOutTenant.phone,
          checkOutDate,
          secDeposit,
          kcDeposit,
          kcCount,
          kcReturned,
          kcRefund,
          proratedRefundAmount,
          prevWater,
          finalWaterNum,
          waterUnits,
          waterCost,
          prevElec,
          finalElecNum,
          elecUnits,
          elecCost,
          cleanFee,
          repFee,
          othDed,
          totalRefundable,
          totalDeductions,
          netRefund,
          buildingName: selectedRoom.floor?.building?.name || 'พักดี อพาร์ทเมนท์',
        });

        setShowCheckOutReceiptModal(true);
        refreshDashboardData();
        refreshTenants();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการทำรายการย้ายออก');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleScanIdCard = async (e: React.ChangeEvent<HTMLInputElement>, target: 'CHECK_IN' | 'BOOKING') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningIdCard(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;

        const res = await fetch('/api/scan-id-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await res.json();
        setIsScanningIdCard(false);

        if (res.ok && data.success && data.data) {
          if (target === 'CHECK_IN') {
            if (data.data.name) setCheckInName(data.data.name);
            if (data.data.idCard) setCheckInIdCard(data.data.idCard);
            if (data.data.address) setCheckInAddress(data.data.address);
          } else if (target === 'BOOKING') {
            if (data.data.name) setBookingName(data.data.name);
            if (data.data.idCard) setBookingIdCard(data.data.idCard);
          }
          alert('✨ สแกนบัตรประชาชนสำเร็จ! ระบบได้กรอกชื่อ, เลขบัตร 13 หลัก และที่อยู่อัตโนมัติเรียบร้อยแล้ว');
        } else {
          alert(data.error || 'ไม่สามารถอ่านข้อมูลจากภาพบัตรประชาชนได้ กรุณาถ่ายใหม่');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanningIdCard(false);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ภาพ');
    }
  };

  // Utility readings submission
  const handleMeterInput = (roomId: string, type: 'water' | 'elec', value: string) => {
    setMeterErrors(prev => ({ ...prev, [roomId]: '' }));
    if (type === 'water') {
      setWaterReadings(prev => ({ ...prev, [roomId]: value }));
    } else {
      setElecReadings(prev => ({ ...prev, [roomId]: value }));
    }
  };

  const handleSingleMeterSubmit = async (roomId: string, prevWater: number, prevElec: number) => {
    const water = waterReadings[roomId];
    const elec = elecReadings[roomId];

    if (meterEntryMode === 'BOTH') {
      if (!water && !elec) {
        alert('กรุณากรอกเลขมิเตอร์น้ำหรือไฟอย่างน้อยหนึ่งรายการ');
        return;
      }
    } else if (meterEntryMode === 'WATER') {
      if (!water) {
        alert('กรุณากรอกเลขมิเตอร์น้ำ');
        return;
      }
    } else if (meterEntryMode === 'ELEC') {
      if (!elec) {
        alert('กรุณากรอกเลขมิเตอร์ไฟ');
        return;
      }
    }

    const waterNum = water ? parseFloat(water) : undefined;
    const elecNum = elec ? parseFloat(elec) : undefined;

    if (waterNum !== undefined && waterNum < prevWater) {
      alert(`เลขมิเตอร์น้ำใหม่ (${waterNum}) ต้องไม่น้อยกว่าค่าเดิม (${prevWater})`);
      setWaterReadings(prev => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      return;
    }

    if (elecNum !== undefined && elecNum < prevElec) {
      alert(`เลขมิเตอร์ไฟใหม่ (${elecNum}) ต้องไม่น้อยกว่าค่าเดิม (${prevElec})`);
      setElecReadings(prev => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      return;
    }

    // Set ISO Date format based on selected period
    // e.g. "2026-07" -> Date at last second of that month
    const [year, month] = meterPeriod.split('-').map(Number);
    const date = new Date(Date.UTC(year, month, 0, 12, 0, 0)); // last day of month noon

    try {
      const res = await fetch('/api/meter-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          waterValue: waterNum,
          electricityValue: elecNum,
          readingDate: date.toISOString(),
        }),
      });

      if (res.ok) {
        setMeterStatus(prev => {
          const suffix = `roomId-${roomId}-saved`;
          return prev ? `${prev},${suffix}` : suffix;
        });
        setTimeout(() => {
          setMeterStatus(prev => prev.replace(`roomId-${roomId}-saved`, '').replace(/^,|,$/, '').replace(',,', ','));
        }, 4000);

        // Check if an invoice exists for this room in meterPeriod
        const existingInv = invoices.find(
          (inv: any) => inv.roomId === roomId && inv.billingPeriod === meterPeriod
        );

        if (existingInv) {
          if (existingInv.status === 'UNPAID') {
            const wantUpdateInvoice = confirm(
              `ห้องนี้มีใบแจ้งหนี้รอบบิล ${formatThaiBillingPeriod(meterPeriod)} แล้ว\n\nคุณต้องการให้อัปเดตคำนวณค่าน้ำ-ไฟ และยอดรวมในใบแจ้งหนี้ใหม่ด้วยหรือไม่?`
            );

            if (wantUpdateInvoice) {
              const newCurWater = waterNum !== undefined ? waterNum : existingInv.currentWater;
              const newCurElec = elecNum !== undefined ? elecNum : existingInv.currentElec;
              const waterUnits = Math.max(0, newCurWater - existingInv.previousWater);
              const elecUnits = Math.max(0, newCurElec - existingInv.previousElec);

              const wRate = existingInv.waterRate ?? existingInv.room?.floor?.building?.waterRate ?? 18;
              const eRate = existingInv.electricityRate ?? existingInv.room?.floor?.building?.electricityRate ?? 7;

              const newWaterCost = existingInv.room?.waterBillingType === 'FLAT'
                ? (existingInv.room?.flatWaterCost || 0)
                : (existingInv.room?.waterBillingType === 'CUSTOM' ? existingInv.waterCost : waterUnits * wRate);

              const newElecCost = existingInv.room?.elecBillingType === 'FLAT'
                ? (existingInv.room?.flatElecCost || 0)
                : (existingInv.room?.elecBillingType === 'CUSTOM' ? existingInv.electricityCost : elecUnits * eRate);

              const newTotalAmount = (existingInv.rentCost || 0) + newWaterCost + newElecCost + (existingInv.otherCost || 0);

              const invRes = await fetch(`/api/invoices/${existingInv.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  currentWater: newCurWater,
                  waterCost: newWaterCost,
                  currentElec: newCurElec,
                  electricityCost: newElecCost,
                  totalAmount: newTotalAmount,
                }),
              });

              if (invRes.ok) {
                alert('บันทึกมิเตอร์และอัปเดตยอดในใบแจ้งหนี้เรียบร้อยแล้ว');
              } else {
                alert('บันทึกมิเตอร์สำเร็จ แต่เกิดข้อผิดพลาดในการอัปเดตใบแจ้งหนี้');
              }
            } else {
              alert('บันทึกมิเตอร์เรียบร้อยแล้ว (คงยอดในใบแจ้งหนี้เดิมไว้)');
            }
          } else {
            alert('บันทึกมิเตอร์เรียบร้อยแล้ว (ใบแจ้งหนี้มีการรับชำระเงินแล้ว จึงไม่มีการเปลี่ยนแปลงยอดในบิล)');
          }
        } else {
          alert('บันทึกมิเตอร์เรียบร้อยแล้ว');
        }

        refreshDashboardData();
        refreshInvoices();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleSaveAllMeters = async () => {
    if (!activeBuilding) return;
    
    // Find all rooms in active building that have some readings entered and aren't already saved
    const roomsToSave = activeBuilding.floors.flatMap((f: any) => f.rooms).filter((room: any) => {
      const water = waterReadings[room.id];
      const elec = elecReadings[room.id];
      const isSaved = meterStatus.includes(`roomId-${room.id}-saved`);
      if (isSaved) return false;
      
      if (meterEntryMode === 'BOTH') return water || elec;
      if (meterEntryMode === 'WATER') return !!water;
      if (meterEntryMode === 'ELEC') return !!elec;
      return false;
    });

    if (roomsToSave.length === 0) {
      alert('ไม่มีข้อมูลมิเตอร์ใหม่ให้บันทึก (กรุณากรอกเลขมิเตอร์ของห้องที่ต้องการบันทึกก่อน)');
      return;
    }

    // Check if any room has invalid meter values (less than previous)
    const invalidRooms = roomsToSave.filter((room: any) => {
      const water = waterReadings[room.id];
      const elec = elecReadings[room.id];
      const waterNum = water ? parseFloat(water) : undefined;
      const elecNum = elec ? parseFloat(elec) : undefined;
      return (waterNum !== undefined && waterNum < room.prevWater) || (elecNum !== undefined && elecNum < room.prevElec);
    });

    if (invalidRooms.length > 0) {
      alert('พบห้องที่กรอกตัวเลขมิเตอร์น้อยกว่าประวัติเดิม ไม่สามารถบันทึกข้อมูลได้ ระบบจะทำการรีเซ็ตตัวเลขห้องที่มีปัญหาเป็นค่าเดิม กรุณาตรวจสอบตัวเลขอีกครั้ง');
      
      // Revert invalid inputs
      setWaterReadings(prev => {
        const next = { ...prev };
        invalidRooms.forEach((room: any) => {
          const water = waterReadings[room.id];
          const waterNum = water ? parseFloat(water) : undefined;
          if (waterNum !== undefined && waterNum < room.prevWater) {
            delete next[room.id];
          }
        });
        return next;
      });

      setElecReadings(prev => {
        const next = { ...prev };
        invalidRooms.forEach((room: any) => {
          const elec = elecReadings[room.id];
          const elecNum = elec ? parseFloat(elec) : undefined;
          if (elecNum !== undefined && elecNum < room.prevElec) {
            delete next[room.id];
          }
        });
        return next;
      });

      return;
    }

    const [year, month] = meterPeriod.split('-').map(Number);
    const date = new Date(Date.UTC(year, month, 0, 12, 0, 0));

    let successCount = 0;
    let failCount = 0;
    let newSavedStatus = meterStatus;

    for (const room of roomsToSave) {
      const water = waterReadings[room.id];
      const elec = elecReadings[room.id];
      const waterNum = water ? parseFloat(water) : undefined;
      const elecNum = elec ? parseFloat(elec) : undefined;

      try {
        const res = await fetch('/api/meter-readings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room.id,
            waterValue: waterNum,
            electricityValue: elecNum,
            readingDate: date.toISOString(),
          }),
        });

        if (res.ok) {
          successCount++;
          const suffix = `roomId-${room.id}-saved`;
          newSavedStatus = newSavedStatus ? `${newSavedStatus},${suffix}` : suffix;
          
          // Clear inputs on success
          setWaterReadings(prev => {
            const next = { ...prev };
            delete next[room.id];
            return next;
          });
          setElecReadings(prev => {
            const next = { ...prev };
            delete next[room.id];
            return next;
          });

          // Remove checkmark status after 4 seconds
          setTimeout(() => {
            setMeterStatus(prev => prev.replace(`roomId-${room.id}-saved`, '').replace(/^,|,$/, '').replace(',,', ','));
          }, 4000);
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setMeterStatus(newSavedStatus);
    await refreshDashboardData();
    alert(`บันทึกมิเตอร์สำเร็จ ${successCount} ห้อง` + (failCount > 0 ? `, ล้มเหลว/เงื่อนไขไม่ผ่าน ${failCount} ห้อง` : ''));
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          billingPeriod: invoicePeriod,
          dueDate: invoiceDueDate,
          otherCost: invoiceOtherCost,
          customWaterCost: parseFloat(customWaterCostInput || '0'),
          customElecCost: parseFloat(customElecCostInput || '0'),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('ออกใบแจ้งหนี้เรียบร้อยแล้ว');
        setShowInvoiceModal(false);
        setInvoiceOtherCost('0');
        handleRoomClick(selectedRoom.id);
        refreshInvoices();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการออกบิล');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleOpenInvoiceModal = (room: any) => {
    setSelectedRoom(room);
    
    // Smart Default 1: Pay-in-Advance Billing Period -> NEXT MONTH (e.g. issuing in July yields "2026-08" / สิงหาคม)
    const today = new Date();
    const payInAdvancePeriod = getPayInAdvanceBillingPeriod(today);
    setInvoicePeriod(payInAdvancePeriod);
    
    // Smart Default 2: Due Date -> Configured defaultDueDay of the Building (e.g. 5th, 7th, 10th of Next Month)
    const dueDay = room?.floor?.building?.defaultDueDay ?? 5;
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    const nextY = nextMonthDate.getFullYear();
    const nextM = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const nextD = String(dueDay).padStart(2, '0');
    setInvoiceDueDate(`${nextY}-${nextM}-${nextD}`);
    
    // Reset extra items & custom notes
    setInvoiceOtherFeeItems([{ id: '1', name: '', amount: '' }]);
    setInvoiceCustomNote('');
    setInvoiceBookNo('');
    setInvoiceNoStr('');

    setShowRoomModal(false);
    setShowInvoiceModal(true);
  };

  const handleInvoiceClick = async (invoiceId: string) => {
    const res = await fetch(`/api/invoices/${invoiceId}`);
    if (res.ok) {
      const invoiceData = await res.json();
      setSelectedInvoice(invoiceData);
      setShowInvoiceDetailModal(true);
    }
  };

  const handleOpenEditInvoiceModal = (inv: any) => {
    setEditInvoiceId(inv.id);
    setEditPrevWater(String(inv.previousWater || 0));
    setEditCurWater(String(inv.currentWater || 0));
    setEditWaterRate(String(inv.waterRate ?? inv.room?.floor?.building?.waterRate ?? 18));
    setEditPrevElec(String(inv.previousElec || 0));
    setEditCurElec(String(inv.currentElec || 0));
    setEditElecRate(String(inv.electricityRate ?? inv.room?.floor?.building?.electricityRate ?? 7));
    setEditRentCost(String(inv.rentCost || 0));
    setEditOtherNote(inv.otherNote || '');
    setEditDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '');
    setEditStatus(inv.status || 'UNPAID');

    let feeItems: any[] = [];
    if (inv.otherFeeDetails) {
      try {
        feeItems = JSON.parse(inv.otherFeeDetails);
      } catch (e) {
        feeItems = [];
      }
    }

    if (Array.isArray(feeItems) && feeItems.length > 0) {
      setEditOtherFeeItems(feeItems.map((item, idx) => ({
        id: String(idx + 1),
        name: item.name || '',
        amount: String(item.amount || 0),
      })));
    } else if (inv.otherCost > 0) {
      setEditOtherFeeItems([{ id: '1', name: 'ค่าใช้จ่ายอื่นๆ', amount: String(inv.otherCost) }]);
    } else {
      setEditOtherFeeItems([{ id: '1', name: '', amount: '' }]);
    }

    setShowEditInvoiceModal(true);
  };

  const handleEditInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoiceId) return;

    try {
      const pWater = parseFloat(editPrevWater) || 0;
      const cWater = parseFloat(editCurWater) || 0;
      const wRate = parseFloat(editWaterRate) || 0;
      const waterUnits = Math.max(0, cWater - pWater);
      const waterCost = selectedInvoice?.room?.waterBillingType === 'FLAT'
        ? (selectedInvoice?.room?.flatWaterCost || 0)
        : (selectedInvoice?.room?.waterBillingType === 'CUSTOM' ? (selectedInvoice?.waterCost || 0) : waterUnits * wRate);

      const pElec = parseFloat(editPrevElec) || 0;
      const cElec = parseFloat(editCurElec) || 0;
      const eRate = parseFloat(editElecRate) || 0;
      const elecUnits = Math.max(0, cElec - pElec);
      const elecCost = selectedInvoice?.room?.elecBillingType === 'FLAT'
        ? (selectedInvoice?.room?.flatElecCost || 0)
        : (selectedInvoice?.room?.elecBillingType === 'CUSTOM' ? (selectedInvoice?.electricityCost || 0) : elecUnits * eRate);

      const rentCost = parseFloat(editRentCost) || 0;

      const items = editOtherFeeItems.filter(i => i.name && parseFloat(i.amount) > 0).map(i => ({
        name: i.name,
        amount: parseFloat(i.amount) || 0,
      }));
      const otherCost = items.reduce((sum, i) => sum + i.amount, 0);

      const totalAmount = rentCost + waterCost + elecCost + otherCost;

      const res = await fetch(`/api/invoices/${editInvoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousWater: pWater,
          currentWater: cWater,
          waterRate: wRate,
          waterCost,
          previousElec: pElec,
          currentElec: cElec,
          electricityRate: eRate,
          electricityCost: elecCost,
          rentCost,
          otherCost,
          otherFeeDetails: JSON.stringify(items),
          otherNote: editOtherNote,
          dueDate: editDueDate,
          status: editStatus,
          totalAmount,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        alert('แก้ไขใบแจ้งหนี้เรียบร้อยแล้ว');
        setShowEditInvoiceModal(false);
        setSelectedInvoice(updated);
        refreshInvoices();
        refreshDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการแก้ไขใบแจ้งหนี้');
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อระบบล้มเหลว');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amountPaid: parseFloat(paymentAmount),
          paymentMethod,
          status: 'APPROVED',
        }),
      });

      if (res.ok) {
        alert('บันทึกการรับชำระเงินสำเร็จ');
        setShowPaymentModal(false);
        setShowInvoiceDetailModal(false);
        setPaymentAmount('');
        refreshInvoices();
        if (selectedRoom) {
          handleRoomClick(selectedRoom.id);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'บันทึกการชำระเงินผิดพลาด');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>กำลังดาวน์โหลดข้อมูลระบบ...</p>
      </div>
    );
  }

  // Active building helper
  const activeBuilding = buildings.find(b => b.id === selectedBuildingId);

  // Filtered invoices with rich multi-criteria filtering & natural numeric room sorting
  const filteredInvoices = invoices.filter(inv => {
    // 1. Status Filter
    if (invoiceStatusFilter !== 'ALL' && inv.status !== invoiceStatusFilter) {
      return false;
    }
    // 2. Billing Period Filter
    if (invoiceFilterPeriod !== 'ALL' && inv.billingPeriod !== invoiceFilterPeriod) {
      return false;
    }
    // 3. Building Filter
    if (invoiceFilterBuildingId !== 'ALL' && inv.room?.floor?.buildingId !== invoiceFilterBuildingId) {
      return false;
    }
    // 4. Search Query Filter
    if (invoiceSearchQuery.trim()) {
      const q = invoiceSearchQuery.trim().toLowerCase();
      const roomNum = (inv.room?.number || '').toLowerCase();
      const tenantName = (inv.tenant?.name || '').toLowerCase();
      const tenantPhone = (inv.tenant?.phone || '').toLowerCase();
      const buildingName = (inv.room?.floor?.building?.name || '').toLowerCase();
      const bookNo = (inv.bookNo || '').toLowerCase();
      const invoiceNoStr = (inv.invoiceNoStr || '').toLowerCase();
      const period = (inv.billingPeriod || '').toLowerCase();

      return roomNum.includes(q) || tenantName.includes(q) || tenantPhone.includes(q) || buildingName.includes(q) || bookNo.includes(q) || invoiceNoStr.includes(q) || period.includes(q);
    }
    return true;
  }).sort((a, b) => {
    return (a.room?.number || '').localeCompare(b.room?.number || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className={styles.wrapper}>
      {/* Sidebar - Desktop Layout */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Image
            src="/icon-512.jpg"
            alt="SmartApart Logo"
            width={40}
            height={40}
            className={styles.logoImage}
          />
          <div className={styles.logoText}>
            <h2>SmartApart</h2>
            <p>ระบบบริหารจัดการอพาร์ทเมนท์</p>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
          >
            <Icons.Overview />
            <span>ภาพรวมแดชบอร์ด</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`${styles.navItem} ${activeTab === 'map' ? styles.navItemActive : ''}`}
          >
            <Icons.Map />
            <span>แผนผังห้องพัก</span>
          </button>
          <button
            onClick={() => setActiveTab('meter')}
            className={`${styles.navItem} ${activeTab === 'meter' ? styles.navItemActive : ''}`}
          >
            <Icons.Meter />
            <span>จดมิเตอร์น้ำ-ไฟ</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`${styles.navItem} ${activeTab === 'invoices' ? styles.navItemActive : ''}`}
          >
            <Icons.Invoice />
            <span>ใบแจ้งหนี้ / บิล</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tenants');
              refreshTenants();
            }}
            className={`${styles.navItem} ${activeTab === 'tenants' ? styles.navItemActive : ''}`}
          >
            <Icons.User />
            <span>ข้อมูลผู้เช่า</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}
          >
            <Icons.Settings />
            <span>ตั้งค่าระบบ</span>
          </button>
        </nav>

        {adminUser && (
          <div className={styles.userInfo}>
            <div className={styles.userName}>{adminUser.name}</div>
            <div className={styles.userRole}>ผู้ดูแลระบบ (Admin)</div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <Icons.Logout />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Dynamic Header */}
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            {activeTab === 'overview' && (
              <>
                <h1>Dashboard</h1>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  สวัสดี {adminUser ? adminUser.name : 'ผู้ดูแลระบบ'} 👆 — {getThaiBuddhistDate()}
                </p>
              </>
            )}
            {activeTab === 'map' && (
              <>
                <h1>แผนผังตึกและห้องพัก</h1>
                <p>การแสดงสถานะห้องพัก คุมห้องว่าง-เต็ม แบบแยกตึก</p>
              </>
            )}
            {activeTab === 'meter' && (
              <>
                <h1>จดมิเตอร์น้ำและไฟฟ้า</h1>
                <p>กรอกเลขมิเตอร์น้ำไฟรายเดือน คำนวณส่วนต่างอัตโนมัติ</p>
              </>
            )}
            {activeTab === 'invoices' && (
              <>
                <h1>ใบแจ้งหนี้ / ใบเสร็จรับเงิน</h1>
                <p>จัดการใบแจ้งหนี้ประจำเดือน, บันทึกรับชำระเงิน และพิมพ์ใบเสร็จรับเงิน A5</p>
              </>
            )}
            {activeTab === 'tenants' && (
              <>
                <h1>ข้อมูลผู้เช่าและประวัติการพักอาศัย</h1>
                <p>ค้นหารายชื่อผู้เช่า, เบอร์โทรศัพท์, เลขบัตรประชาชน และประวัติการย้ายออก</p>
              </>
            )}
            {activeTab === 'settings' && (
              <>
                <h1>ตั้งค่าระบบและกิจการ</h1>
                <p>กำหนดข้อมูลติดต่ออาคาร ค่าน้ำ-ไฟ และอัตราค่าเช่ารายห้อง</p>
              </>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={toggleTheme}
              className={styles.themeToggleBtn}
              aria-label="สลับธีม"
              title={theme === 'light' ? 'เปลี่ยนเป็นโหมดกลางคืน' : 'เปลี่ยนเป็นโหมดสว่าง'}
            >
              {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            <button onClick={handleLogout} className={styles.mobileLogoutBtn} aria-label="ออกจากระบบ" title="ออกจากระบบ">
              <Icons.Logout />
            </button>
          </div>
        </header>

        {/* --- 1. OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <OverviewTab
            activeStats={activeStats}
            overviewBuildingFilter={overviewBuildingFilter}
            setOverviewBuildingFilter={setOverviewBuildingFilter}
            buildings={buildings}
            invoices={invoices}
            setSelectedBuildingId={setSelectedBuildingId}
            setActiveTab={setActiveTab}
            setOverdueBuildingFilter={setOverdueBuildingFilter}
            setShowOverdueModal={setShowOverdueModal}
            styles={styles}
            Icons={Icons}
          />
        )}

        {/* --- 2. ROOM MAP TAB --- */}
        {activeTab === 'map' && (
          <FloorMapTab
            selectedBuildingId={selectedBuildingId}
            setSelectedBuildingId={setSelectedBuildingId}
            buildings={buildings}
            mapSearchQuery={mapSearchQuery}
            setMapSearchQuery={setMapSearchQuery}
            activeBuilding={activeBuilding}
            handleRoomClick={handleRoomClick}
            styles={styles}
          />
        )}

        {/* --- 3. METER READING TAB --- */}
        {activeTab === 'meter' && (
          <MeterTab
            selectedBuildingId={selectedBuildingId}
            setSelectedBuildingId={setSelectedBuildingId}
            buildings={buildings}
            meterPeriod={meterPeriod}
            setMeterPeriod={setMeterPeriod}
            meterSearchQuery={meterSearchQuery}
            setMeterSearchQuery={setMeterSearchQuery}
            meterStatusFilter={meterStatusFilter}
            setMeterStatusFilter={setMeterStatusFilter}
            meterEntryMode={meterEntryMode}
            setMeterEntryMode={setMeterEntryMode}
            setBulkBillPeriod={setBulkBillPeriod}
            setShowBulkBillModal={setShowBulkBillModal}
            fetchBulkRooms={fetchBulkRooms}
            handleSaveAllMeters={handleSaveAllMeters}
            activeBuilding={activeBuilding}
            invoices={invoices}
            meterStatus={meterStatus}
            meterErrors={meterErrors}
            waterReadings={waterReadings}
            elecReadings={elecReadings}
            handleMeterInput={handleMeterInput}
            handleSingleMeterSubmit={handleSingleMeterSubmit}
            styles={styles}
          />
        )}

        {/* --- 4. INVOICES TAB --- */}
        {activeTab === 'invoices' && (
          <InvoiceTab
            invoiceStatusFilter={invoiceStatusFilter}
            setInvoiceStatusFilter={setInvoiceStatusFilter}
            invoiceFilterPeriod={invoiceFilterPeriod}
            setInvoiceFilterPeriod={setInvoiceFilterPeriod}
            invoiceFilterBuildingId={invoiceFilterBuildingId}
            setInvoiceFilterBuildingId={setInvoiceFilterBuildingId}
            invoiceSearchQuery={invoiceSearchQuery}
            setInvoiceSearchQuery={setInvoiceSearchQuery}
            setShowBulkBillModal={setShowBulkBillModal}
            fetchBulkRooms={fetchBulkRooms}
            bulkBillPeriod={bulkBillPeriod}
            filteredInvoices={filteredInvoices}
            setShowBatchPrintModal={setShowBatchPrintModal}
            handleInvoiceClick={handleInvoiceClick}
            setSelectedInvoice={setSelectedInvoice}
            setPaymentAmount={setPaymentAmount}
            setShowPaymentModal={setShowPaymentModal}
            invoices={invoices}
            buildings={buildings}
            styles={styles}
          />
        )}

        {/* --- 5. TENANTS DIRECTORY TAB --- */}
        {activeTab === 'tenants' && (
          <TenantTab
            tenantsList={tenantsList}
            refreshTenants={refreshTenants}
            tenantSearchQuery={tenantSearchQuery}
            setTenantSearchQuery={setTenantSearchQuery}
            tenantBuildingFilter={tenantBuildingFilter}
            setTenantBuildingFilter={setTenantBuildingFilter}
            buildings={buildings}
            tenantStatusTab={tenantStatusTab}
            setTenantStatusTab={setTenantStatusTab}
            tenantsLoading={tenantsLoading}
            handleOpenEditTenantModal={handleOpenEditTenantModal}
            styles={styles}
          />
        )}

        {/* --- 6. SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <SettingsTab
            propName={propName}
            setPropName={setPropName}
            propPhone={propPhone}
            setPropPhone={setPropPhone}
            propEmail={propEmail}
            setPropEmail={setPropEmail}
            propAddress={propAddress}
            setPropAddress={setPropAddress}
            propLineId={propLineId}
            setPropLineId={setPropLineId}
            propGeminiApiKey={propGeminiApiKey}
            setPropGeminiApiKey={setPropGeminiApiKey}
            showGeminiKey={showGeminiKey}
            setShowGeminiKey={setShowGeminiKey}
            refreshPropertyData={refreshPropertyData}
            refreshDashboardData={refreshDashboardData}
            settingsBuildingId={settingsBuildingId}
            setSettingsBuildingId={setSettingsBuildingId}
            buildings={buildings}
            selectedBuildingId={selectedBuildingId}
            setSelectedBuildingId={setSelectedBuildingId}
            roomsSearchQuery={roomsSearchQuery}
            setRoomsSearchQuery={setRoomsSearchQuery}
            showRoomsAdvancedFilters={showRoomsAdvancedFilters}
            setShowRoomsAdvancedFilters={setShowRoomsAdvancedFilters}
            roomsTypeFilter={roomsTypeFilter}
            setRoomsTypeFilter={setRoomsTypeFilter}
            roomsWaterFilter={roomsWaterFilter}
            setRoomsWaterFilter={setRoomsWaterFilter}
            roomsElecFilter={roomsElecFilter}
            setRoomsElecFilter={setRoomsElecFilter}
            roomsStatusFilter={roomsStatusFilter}
            setRoomsStatusFilter={setRoomsStatusFilter}
            activeBuilding={activeBuilding}
            handleRoomClick={handleRoomClick}
            styles={styles}
          />
        )}
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION (PWA) --- */}
       <nav className={styles.mobileNav}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`${styles.mobileNavItem} ${activeTab === 'overview' ? styles.mobileNavItemActive : ''}`}
        >
          <Icons.Overview />
          <span>แดชบอร์ด</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`${styles.mobileNavItem} ${activeTab === 'map' ? styles.mobileNavItemActive : ''}`}
        >
          <Icons.Map />
          <span>ผังห้อง</span>
        </button>
        <button
          onClick={() => setActiveTab('meter')}
          className={`${styles.mobileNavItem} ${activeTab === 'meter' ? styles.mobileNavItemActive : ''}`}
        >
          <Icons.Meter />
          <span>จดน้ำไฟ</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`${styles.mobileNavItem} ${activeTab === 'invoices' ? styles.mobileNavItemActive : ''}`}
        >
          <Icons.Invoice />
          <span>บิลค่าเช่า</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('tenants');
            refreshTenants();
          }}
          className={`${styles.mobileNavItem} ${activeTab === 'tenants' ? styles.mobileNavItemActive : ''}`}
        >
          <Icons.User />
          <span>ผู้เช่า</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`${styles.mobileNavItem} ${activeTab === 'settings' ? styles.mobileNavItemActive : ''}`}
        >
          <Icons.Settings />
          <span>ตั้งค่า</span>
        </button>
      </nav>

      {/* --- MODAL 1: ROOM DETAILS MODAL --- */}
      <RoomModal
        showRoomModal={showRoomModal}
        setShowRoomModal={setShowRoomModal}
        selectedRoom={selectedRoom}
        setCheckInWaterMeter={setCheckInWaterMeter}
        setCheckInElecMeter={setCheckInElecMeter}
        setCheckInSecurityDeposit={setCheckInSecurityDeposit}
        setCheckInEmergencyRel={setCheckInEmergencyRel}
        setCheckInUseKeycard={setCheckInUseKeycard}
        setCheckInKeycardCount={setCheckInKeycardCount}
        setCheckInKeycardDeposit={setCheckInKeycardDeposit}
        setCheckInKeycardCode={setCheckInKeycardCode}
        setShowCheckInModal={setShowCheckInModal}
        setBookingName={setBookingName}
        setBookingPhone={setBookingPhone}
        setBookingIdCard={setBookingIdCard}
        setBookingEmail={setBookingEmail}
        setBookingLineId={setBookingLineId}
        setBookingCheckInDate={setBookingCheckInDate}
        setBookingDeposit={setBookingDeposit}
        setBookingNote={setBookingNote}
        setBookingSlipImage={setBookingSlipImage}
        setBookingMode={setBookingMode}
        setShowBookingModal={setShowBookingModal}
        refreshDashboardData={refreshDashboardData}
        handleBookingCheckInSubmit={handleBookingCheckInSubmit}
        handleBookingCancel={handleBookingCancel}
        handleOpenInvoiceModal={handleOpenInvoiceModal}
        handleOpenCheckOutModal={handleOpenCheckOutModal}
        handleCancelCheckIn={handleCancelCheckIn}
        handleOpenRoomTransferModal={handleOpenRoomTransferModal}
        handleOpenReplaceMeterModal={(room: any) => {
          setSelectedRoom(room);
          setShowReplaceMeterModal(true);
        }}
        modalWaterType={modalWaterType}
        setModalWaterType={setModalWaterType}
        modalElecType={modalElecType}
        setModalElecType={setModalElecType}
        styles={styles}
        Icons={Icons}
      />

      {/* --- MODAL 2: CHECK IN MODAL --- */}
      <CheckInModal
        showCheckInModal={showCheckInModal}
        setShowCheckInModal={setShowCheckInModal}
        setShowRoomModal={setShowRoomModal}
        selectedRoom={selectedRoom}
        handleCheckInSubmit={handleCheckInSubmit}
        isScanningIdCard={isScanningIdCard}
        handleScanIdCard={handleScanIdCard}
        checkInName={checkInName}
        setCheckInName={setCheckInName}
        checkInPhone={checkInPhone}
        setCheckInPhone={setCheckInPhone}
        checkInIdCard={checkInIdCard}
        setCheckInIdCard={setCheckInIdCard}
        checkInAddress={checkInAddress}
        setCheckInAddress={setCheckInAddress}
        checkInWorkplace={checkInWorkplace}
        setCheckInWorkplace={setCheckInWorkplace}
        checkInLineId={checkInLineId}
        setCheckInLineId={setCheckInLineId}
        checkInEmergencyName={checkInEmergencyName}
        setCheckInEmergencyName={setCheckInEmergencyName}
        checkInEmergencyRel={checkInEmergencyRel}
        setCheckInEmergencyRel={setCheckInEmergencyRel}
        checkInEmergencyPhone={checkInEmergencyPhone}
        setCheckInEmergencyPhone={setCheckInEmergencyPhone}
        checkInSecurityDeposit={checkInSecurityDeposit}
        setCheckInSecurityDeposit={setCheckInSecurityDeposit}
        checkInUseKeycard={checkInUseKeycard}
        setCheckInUseKeycard={setCheckInUseKeycard}
        checkInKeycardCount={checkInKeycardCount}
        setCheckInKeycardCount={setCheckInKeycardCount}
        checkInKeycardDeposit={checkInKeycardDeposit}
        setCheckInKeycardDeposit={setCheckInKeycardDeposit}
        checkInKeycardCode={checkInKeycardCode}
        setCheckInKeycardCode={setCheckInKeycardCode}
        checkInDate={checkInDate}
        setCheckInDate={setCheckInDate}
        checkInWaterMeter={checkInWaterMeter}
        setCheckInWaterMeter={setCheckInWaterMeter}
        checkInElecMeter={checkInElecMeter}
        setCheckInElecMeter={setCheckInElecMeter}
        checkInNote={checkInNote}
        setCheckInNote={setCheckInNote}
        styles={styles}
      />

      {/* --- MODAL 2.2 & 2.3: CHECK-OUT & RECEIPT MODALS --- */}
      <CheckOutModal
        showCheckOutModal={showCheckOutModal}
        setShowCheckOutModal={setShowCheckOutModal}
        selectedRoom={selectedRoom}
        activeCheckOutTenant={activeCheckOutTenant}
        handleCheckOutSubmit={handleCheckOutSubmit}
        checkOutActionType={checkOutActionType}
        setCheckOutActionType={setCheckOutActionType}
        checkOutNoticeDate={checkOutNoticeDate}
        setCheckOutNoticeDate={setCheckOutNoticeDate}
        checkOutDate={checkOutDate}
        setCheckOutDate={setCheckOutDate}
        checkOutOverrideForfeit={checkOutOverrideForfeit}
        setCheckOutOverrideForfeit={setCheckOutOverrideForfeit}
        checkOutFinalWater={checkOutFinalWater}
        setCheckOutFinalWater={setCheckOutFinalWater}
        checkOutFinalElec={checkOutFinalElec}
        setCheckOutFinalElec={setCheckOutFinalElec}
        checkOutKeycardsReturned={checkOutKeycardsReturned}
        setCheckOutKeycardsReturned={setCheckOutKeycardsReturned}
        checkOutRefundProratedRent={checkOutRefundProratedRent}
        setCheckOutRefundProratedRent={setCheckOutRefundProratedRent}
        checkOutCleaningFee={checkOutCleaningFee}
        setCheckOutCleaningFee={setCheckOutCleaningFee}
        checkOutRepairFee={checkOutRepairFee}
        setCheckOutRepairFee={setCheckOutRepairFee}
        checkOutOtherDeductions={checkOutOtherDeductions}
        setCheckOutOtherDeductions={setCheckOutOtherDeductions}
        checkOutNote={checkOutNote}
        setCheckOutNote={setCheckOutNote}
        showCheckOutReceiptModal={showCheckOutReceiptModal}
        setShowCheckOutReceiptModal={setShowCheckOutReceiptModal}
        checkOutReceiptData={checkOutReceiptData}
        styles={styles}
      />

      {/* --- MODAL 2.5: BOOKING MODAL --- */}
      <BookingModal
        showBookingModal={showBookingModal}
        setShowBookingModal={setShowBookingModal}
        setShowRoomModal={setShowRoomModal}
        selectedRoom={selectedRoom}
        bookingMode={bookingMode}
        setBookingMode={setBookingMode}
        handleBookingSubmit={handleBookingSubmit}
        isScanningIdCard={isScanningIdCard}
        handleScanIdCard={handleScanIdCard}
        bookingName={bookingName}
        setBookingName={setBookingName}
        bookingPhone={bookingPhone}
        setBookingPhone={setBookingPhone}
        bookingCheckInDate={bookingCheckInDate}
        setBookingCheckInDate={setBookingCheckInDate}
        bookingDeposit={bookingDeposit}
        setBookingDeposit={setBookingDeposit}
        bookingIdCard={bookingIdCard}
        setBookingIdCard={setBookingIdCard}
        bookingLineId={bookingLineId}
        setBookingLineId={setBookingLineId}
        bookingEmail={bookingEmail}
        setBookingEmail={setBookingEmail}
        bookingPaymentMethod={bookingPaymentMethod}
        setBookingPaymentMethod={setBookingPaymentMethod}
        bookingNote={bookingNote}
        setBookingNote={setBookingNote}
        styles={styles}
      />

      {/* --- MODAL 3: INVOICE GENERATOR, DETAIL A5 & EDIT INVOICE MODALS --- */}
      <InvoiceDetailModal
        showInvoiceModal={showInvoiceModal}
        setShowInvoiceModal={setShowInvoiceModal}
        selectedRoom={selectedRoom}
        setShowRoomModal={setShowRoomModal}
        handleGenerateInvoice={handleGenerateInvoice}
        invoiceBookNo={invoiceBookNo}
        setInvoiceBookNo={setInvoiceBookNo}
        invoiceNoStr={invoiceNoStr}
        setInvoiceNoStr={setInvoiceNoStr}
        invoicePeriod={invoicePeriod}
        setInvoicePeriod={setInvoicePeriod}
        invoiceDueDate={invoiceDueDate}
        setInvoiceDueDate={setInvoiceDueDate}
        customWaterCostInput={customWaterCostInput}
        setCustomWaterCostInput={setCustomWaterCostInput}
        customElecCostInput={customElecCostInput}
        setCustomElecCostInput={setCustomElecCostInput}
        invoiceOtherFeeItems={invoiceOtherFeeItems}
        setInvoiceOtherFeeItems={setInvoiceOtherFeeItems}
        invoiceCustomNote={invoiceCustomNote}
        setInvoiceCustomNote={setInvoiceCustomNote}
        showInvoiceDetailModal={showInvoiceDetailModal}
        setShowInvoiceDetailModal={setShowInvoiceDetailModal}
        selectedInvoice={selectedInvoice}
        activePrintTab={activePrintTab}
        setActivePrintTab={setActivePrintTab}
        handlePrintA5={handlePrintA5}
        handleOpenEditInvoiceModal={handleOpenEditInvoiceModal}
        showInvoiceQr={showInvoiceQr}
        setShowInvoiceQr={setShowInvoiceQr}
        paymentReceiverName={paymentReceiverName}
        showEditInvoiceModal={showEditInvoiceModal}
        setShowEditInvoiceModal={setShowEditInvoiceModal}
        handleEditInvoiceSubmit={handleEditInvoiceSubmit}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        editDueDate={editDueDate}
        setEditDueDate={setEditDueDate}
        editPrevWater={editPrevWater}
        setEditPrevWater={setEditPrevWater}
        editCurWater={editCurWater}
        setEditCurWater={setEditCurWater}
        editWaterRate={editWaterRate}
        setEditWaterRate={setEditWaterRate}
        editPrevElec={editPrevElec}
        setEditPrevElec={setEditPrevElec}
        editCurElec={editCurElec}
        setEditCurElec={setEditCurElec}
        editElecRate={editElecRate}
        setEditElecRate={setEditElecRate}
        editRentCost={editRentCost}
        setEditRentCost={setEditRentCost}
        editOtherFeeItems={editOtherFeeItems}
        setEditOtherFeeItems={setEditOtherFeeItems}
        editOtherNote={editOtherNote}
        setEditOtherNote={setEditOtherNote}
        styles={styles}
      />

      {/* --- MODAL 4: RECORD PAYMENT MODAL --- */}
      <PaymentModal
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        selectedInvoice={selectedInvoice}
        showInvoiceDetailModal={showInvoiceDetailModal}
        setShowInvoiceDetailModal={setShowInvoiceDetailModal}
        handleRecordPayment={handleRecordPayment}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentDate={paymentDate}
        setPaymentDate={setPaymentDate}
        paymentSlipImage={paymentSlipImage}
        setPaymentSlipImage={setPaymentSlipImage}
        paymentReceiverName={paymentReceiverName}
        setPaymentReceiverName={setPaymentReceiverName}
        styles={styles}
      />

      {/* --- MODAL 4.6: BATCH PRINT OPTIONS MODAL --- */}
      <BatchPrintModal
        showBatchPrintModal={showBatchPrintModal}
        setShowBatchPrintModal={setShowBatchPrintModal}
        filteredInvoices={filteredInvoices}
        handleBatchPrintA5List={handleBatchPrintA5List}
        styles={styles}
      />

      {/* --- MODAL 4.7: EDIT TENANT MODAL --- */}
      <EditTenantModal
        showEditTenantModal={showEditTenantModal}
        setShowEditTenantModal={setShowEditTenantModal}
        editingTenant={editingTenant}
        handleSaveTenantInfo={handleSaveTenantInfo}
        editTenantName={editTenantName}
        setEditTenantName={setEditTenantName}
        editTenantPhone={editTenantPhone}
        setEditTenantPhone={setEditTenantPhone}
        editTenantIdCard={editTenantIdCard}
        setEditTenantIdCard={setEditTenantIdCard}
        editTenantLineId={editTenantLineId}
        setEditTenantLineId={setEditTenantLineId}
        editTenantEmail={editTenantEmail}
        setEditTenantEmail={setEditTenantEmail}
        editTenantAddress={editTenantAddress}
        setEditTenantAddress={setEditTenantAddress}
        editTenantWorkplace={editTenantWorkplace}
        setEditTenantWorkplace={setEditTenantWorkplace}
        editTenantEmergencyName={editTenantEmergencyName}
        setEditTenantEmergencyName={setEditTenantEmergencyName}
        editTenantEmergencyRel={editTenantEmergencyRel}
        setEditTenantEmergencyRel={setEditTenantEmergencyRel}
        editTenantEmergencyPhone={editTenantEmergencyPhone}
        setEditTenantEmergencyPhone={setEditTenantEmergencyPhone}
        editTenantNote={editTenantNote}
        setEditTenantNote={setEditTenantNote}
        editTenantStartDate={editTenantStartDate}
        setEditTenantStartDate={setEditTenantStartDate}
        editTenantSaving={editTenantSaving}
        styles={styles}
      />

      {/* --- MODAL 4.8: ROOM TRANSFER MODAL --- */}
      <RoomTransferModal
        showTransferModal={showTransferModal}
        setShowTransferModal={setShowTransferModal}
        selectedRoom={selectedRoom}
        vacantRooms={buildings.flatMap((b: any) => b.floors.flatMap((f: any) => f.rooms)).filter((r: any) => r.status === 'VACANT')}
        handleExecuteTransfer={handleExecuteTransfer}
        styles={styles}
      />

      {/* --- MODAL 4.9: REPLACE METER MODAL --- */}
      <ReplaceMeterModal
        showReplaceMeterModal={showReplaceMeterModal}
        setShowReplaceMeterModal={setShowReplaceMeterModal}
        selectedRoom={selectedRoom}
        onSuccess={() => refreshDashboardData()}
        styles={styles}
      />



      {/* --- MODAL 6: OVERDUE / UNPAID BILLS MODAL --- */}
      {showOverdueModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '800px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ color: 'var(--status-unpaid)' }}>
                รายการค้างชำระทั้งหมด (Overdue Bills)
              </h2>
              <button className={styles.modalClose} onClick={() => setShowOverdueModal(false)} aria-label="ปิด">&times;</button>
            </div>

            <div className={styles.modalBody}>
              {/* Building selector inside modal */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>เลือกตึก:</span>
                <button
                  onClick={() => setOverdueBuildingFilter('ALL')}
                  className={`${styles.btn} ${styles.btnFilterPill} ${overdueBuildingFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
                >
                  ทั้งหมด
                </button>
                {buildings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setOverdueBuildingFilter(b.id)}
                    className={`${styles.btn} ${styles.btnFilterPill} ${overdueBuildingFilter === b.id ? styles.btnPrimary : styles.btnSecondary}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              {/* Table listing unpaid invoices */}
              <div style={{ overflowX: 'auto', maxHeight: '50vh' }}>
                <table className={styles.meterTable}>
                  <thead>
                    <tr>
                      <th>ห้องพัก</th>
                      <th>อาคาร / ตึก</th>
                      <th>ผู้เช่า</th>
                      <th>รอบบิล</th>
                      <th>ยอดเงินค้าง</th>
                      <th>ครบกำหนด</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices
                      .filter((inv) => inv.status === 'UNPAID')
                      .filter((inv) => overdueBuildingFilter === 'ALL' || inv.room.floor.buildingId === overdueBuildingFilter)
                      .map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--status-unpaid)' }}>{inv.room.number}</td>
                          <td>{inv.room.floor.building.name}</td>
                          <td>
                            <div>{inv.tenant.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inv.tenant.phone}</div>
                          </td>
                          <td>{inv.billingPeriod}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--status-unpaid)' }}>{inv.totalAmount.toLocaleString()} บาท</td>
                          <td style={{ fontSize: '0.85rem', color: new Date(inv.dueDate) < new Date() ? 'var(--status-unpaid)' : 'inherit' }}>
                            {new Date(inv.dueDate).toLocaleDateString('th-TH')}
                            {new Date(inv.dueDate) < new Date() && ' (เกินกำหนด)'}
                          </td>
                          <td>
                            <button
                              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnFilterPill}`}
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount(inv.totalAmount.toString());
                                setShowPaymentModal(true);
                              }}
                            >
                              ชำระเงิน
                            </button>
                          </td>
                        </tr>
                      ))}
                    {invoices.filter((inv) => inv.status === 'UNPAID').filter((inv) => overdueBuildingFilter === 'ALL' || inv.room.floor.buildingId === overdueBuildingFilter).length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                          ไม่มีรายการค้างชำระในระบบ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowOverdueModal(false)}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {showBulkBillModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '900px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚡ ออกบิลค่าเช่าพร้อมกันทุกห้อง (Bulk Bill Generation)
              </h2>
              <button className={styles.modalClose} onClick={() => setShowBulkBillModal(false)} aria-label="ปิด">&times;</button>
            </div>

            <div className={styles.modalBody} style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {/* Header Controls: Billing Period & Due Date Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel}>📅 เลือกรอบบิลประจำเดือน *</label>
                  <input
                    type="month"
                    className={styles.formInput}
                    value={bulkBillPeriod}
                    onChange={(e) => {
                      setBulkBillPeriod(e.target.value);
                      fetchBulkRooms(e.target.value);
                    }}
                  />
                </div>

                <div className={styles.formGroup} style={{ margin: 0 }}>
                  <label className={styles.formLabel}>⏰ วันที่ครบกำหนดชำระ *</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={bulkBillDueDate}
                    onChange={(e) => setBulkBillDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Dual Filter Bars: Apartment & Invoice Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem', backgroundColor: 'var(--bg-color)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                {/* Row 1: Building Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '95px' }}>🏢 อพาร์ทเมนท์:</span>
                  <button
                    type="button"
                    onClick={() => setBulkBuildingFilter('ALL')}
                    className={`${styles.btn} ${bulkBuildingFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    🏢 ทั้งหมด
                  </button>
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBulkBuildingFilter(b.id)}
                      className={`${styles.btn} ${bulkBuildingFilter === b.id ? styles.btnPrimary : styles.btnSecondary}`}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>

                {/* Row 2: Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '95px' }}>📋 สถานะบิล:</span>
                  <button
                    type="button"
                    onClick={() => setBulkStatusFilter('ALL')}
                    className={`${styles.btn} ${bulkStatusFilter === 'ALL' ? styles.btnPrimary : styles.btnSecondary}`}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    📋 ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStatusFilter('UNPAID_ONLY')}
                    className={`${styles.btn} ${bulkStatusFilter === 'UNPAID_ONLY' ? styles.btnPrimary : styles.btnSecondary}`}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    ⏳ ยังไม่ได้ออกบิล
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStatusFilter('PAID_ONLY')}
                    className={`${styles.btn} ${bulkStatusFilter === 'PAID_ONLY' ? styles.btnPrimary : styles.btnSecondary}`}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    ✅ ออกบิลแล้ว
                  </button>
                </div>
              </div>

              {/* Status Summary Cards & Room List */}
              {(() => {
                let displayRooms = bulkRoomList
                  .filter(r => bulkBuildingFilter === 'ALL' || r.buildingId === bulkBuildingFilter)
                  .filter(r => {
                    if (bulkStatusFilter === 'UNPAID_ONLY') return !r.hasInvoice;
                    if (bulkStatusFilter === 'PAID_ONLY') return r.hasInvoice;
                    return true;
                  });

                // Global Sorting:
                // Major Group 1: Not Billed (!hasInvoice) -> Major Group 2: Billed (hasInvoice)
                // Sub Sort within each group: Building Name (th) -> Room Number (numeric)
                displayRooms.sort((a, b) => {
                  const billedPriorityA = a.hasInvoice ? 2 : 1;
                  const billedPriorityB = b.hasInvoice ? 2 : 1;
                  if (billedPriorityA !== billedPriorityB) return billedPriorityA - billedPriorityB;

                  const bComp = a.buildingName.localeCompare(b.buildingName, 'th');
                  if (bComp !== 0) return bComp;

                  return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
                });

                const totalRooms = displayRooms.length;
                const withMeter = displayRooms.filter(r => r.hasMeter).length;
                const alreadyHasInvoice = displayRooms.filter(r => r.hasInvoice).length;
                const eligibleToGen = displayRooms.filter(r => !r.hasInvoice && r.hasMeter).length;

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ห้องที่มีคนเช่า (ตามตัวกรอง)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{totalRooms} ห้อง</div>
                      </div>
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>จดมิเตอร์แล้ว</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: withMeter === totalRooms ? 'var(--status-vacant)' : 'var(--status-booked)' }}>
                          {withMeter} / {totalRooms} ห้อง
                        </div>
                      </div>
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ออกบิลแล้วในรอบนี้</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-occupied)' }}>{alreadyHasInvoice} ห้อง</div>
                      </div>
                      <div style={{ background: eligibleToGen > 0 ? 'var(--status-vacant-bg)' : 'var(--card-bg)', border: `1px solid ${eligibleToGen > 0 ? 'var(--status-vacant)' : 'var(--border-color)'}`, padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>พร้อมออกบิลในครั้งนี้</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-vacant)' }}>{eligibleToGen} ห้อง</div>
                      </div>
                    </div>

                    {/* Generation Result Banner if complete */}
                    {bulkResult && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        backgroundColor: bulkResult.failCount === 0 ? 'var(--status-vacant-bg)' : 'var(--status-booked-bg)',
                        border: `1px solid ${bulkResult.failCount === 0 ? 'var(--status-vacant)' : 'var(--status-booked)'}`,
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: bulkResult.failCount === 0 ? 'var(--status-vacant)' : 'var(--status-booked)', marginBottom: '0.25rem' }}>
                          🎉 ดำเนินการออกบิลเรียบร้อยแล้ว: สำเร็จ {bulkResult.successCount} ห้อง {bulkResult.failCount > 0 ? `| ข้าม/ล้มเหลว ${bulkResult.failCount} ห้อง` : ''}
                        </div>
                        {bulkResult.failCount > 0 && (
                          <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.82rem', color: 'var(--status-unpaid)' }}>
                            {bulkResult.results.filter((r: any) => !r.success).map((r: any) => (
                              <li key={r.roomId}>ห้อง {r.roomNumber}: {r.error}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Room Table List with Extra Fee Controls (Approach C) */}
                    {bulkRoomLoading ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                        ⏳ กำลังโหลดข้อมูลห้องและมิเตอร์...
                      </div>
                    ) : displayRooms.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                        ❌ ไม่พบห้องที่มีผู้เช่าตรงกับเงื่อนไขที่เลือก
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(() => {
                          let lastGroupKey = '';
                          return displayRooms.map((room, idx) => {
                            const isReady = !room.hasInvoice && room.hasMeter;
                            const isWaitingMeter = !room.hasInvoice && !room.hasMeter;
                            const isBilled = room.hasInvoice;
                            const feeRows = bulkExtraFees[room.roomId] || [];

                            const groupKey = `${isBilled ? 'BILLED' : 'UNBILLED'}_${room.buildingId}`;
                            const isNewGroup = groupKey !== lastGroupKey;
                            lastGroupKey = groupKey;

                            const cardBg = isReady
                              ? 'var(--status-vacant-bg)'
                              : isWaitingMeter
                              ? 'var(--status-booked-bg)'
                              : 'var(--status-occupied-bg)';

                            const cardBorder = isReady
                              ? '1px solid var(--status-vacant)'
                              : isWaitingMeter
                              ? '1px solid var(--status-booked)'
                              : '1px solid var(--status-occupied)';

                            const borderLeftColor = isReady
                              ? 'var(--status-vacant)'
                              : isWaitingMeter
                              ? 'var(--status-booked)'
                              : 'var(--status-occupied)';

                            return (
                              <React.Fragment key={room.roomId}>
                                {isNewGroup && (
                                  <div style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    marginTop: idx === 0 ? '0' : '1rem',
                                    marginBottom: '0.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: isBilled ? 'var(--status-occupied)' : isReady ? 'var(--status-vacant)' : 'var(--status-booked)'
                                  }}>
                                    <span>🏢 {room.buildingName}</span>
                                    <span>•</span>
                                    <span>
                                      {isBilled
                                        ? `✅ ออกบิลเรียบร้อยแล้ว (${displayRooms.filter(r => r.buildingId === room.buildingId && r.hasInvoice).length} ห้อง)`
                                        : `⏳ ยังไม่ได้ออกบิล (${displayRooms.filter(r => r.buildingId === room.buildingId && !r.hasInvoice).length} ห้อง)`
                                      }
                                    </span>
                                  </div>
                                )}

                                <div
                                  style={{
                                    background: cardBg,
                                    borderRadius: 'var(--radius-md)',
                                    border: cardBorder,
                                    padding: '0.85rem 1rem',
                                    borderLeft: `5px solid ${borderLeftColor}`,
                                    opacity: isBilled ? 0.75 : 1,
                                  }}
                                >
                              {/* Header Line: Room, Tenant, Meter & Status */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    🏠 ห้อง {room.roomNumber}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    👤 {room.tenantName} ({room.buildingName})
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {/* Meter Indicator */}
                                  {room.hasMeter ? (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--status-vacant)', background: 'var(--status-vacant-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--status-vacant)' }}>
                                      💧 {room.meterWater} | ⚡ {room.meterElec}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--status-unpaid)', background: 'var(--status-unpaid-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--status-unpaid)' }}>
                                      ⚠️ ยังไม่ได้บันทึกมิเตอร์
                                    </span>
                                  )}

                                  {/* Invoice Indicator */}
                                  {room.hasInvoice ? (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--status-occupied)', fontWeight: 600, background: 'var(--status-occupied-bg)', padding: '0.2rem 0.55rem', borderRadius: '20px', border: '1px solid var(--status-occupied)' }}>
                                      🟢 ออกบิลแล้ว ({room.existingInvoiceTotal?.toLocaleString()} ฿)
                                    </span>
                                  ) : isReady ? (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--status-vacant)', fontWeight: 600, background: 'var(--status-vacant-bg)', padding: '0.2rem 0.55rem', borderRadius: '20px', border: '1px solid var(--status-vacant)' }}>
                                      ⏳ พร้อมออกบิล (ค่าเช่า {room.basePrice.toLocaleString()} ฿)
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--status-booked)', fontWeight: 600, background: 'var(--status-booked-bg)', padding: '0.2rem 0.55rem', borderRadius: '20px', border: '1px solid var(--status-booked)' }}>
                                      ⏸️ ข้าม (รอมิเตอร์)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Extra Fees Input Rows */}
                              {isReady && (
                                <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--border-color)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                      ➕ ค่าใช้จ่ายเพิ่มเติมสำหรับห้องนี้ (ถ้ามี เช่น ค่าซ่อม, ค่าที่จอดรถ):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => addBulkFeeRow(room.roomId)}
                                      className={`${styles.btn} ${styles.btnSecondary}`}
                                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}
                                    >
                                      + เพิ่มรายการ
                                    </button>
                                  </div>

                                  {feeRows.map((fee: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        placeholder="ชื่อรายการ (เช่น ค่าซ่อมแอร์)"
                                        value={fee.name}
                                        onChange={(e) => updateBulkFee(room.roomId, idx, 'name', e.target.value)}
                                        className={styles.formInput}
                                        style={{ flex: 2, padding: '0.3rem 0.5rem', fontSize: '0.8rem', minHeight: '32px' }}
                                      />
                                      <input
                                        type="number"
                                        placeholder="จำนวนเงิน (บาท)"
                                        value={fee.amount}
                                        onChange={(e) => updateBulkFee(room.roomId, idx, 'amount', e.target.value)}
                                        className={styles.formInput}
                                        style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem', minHeight: '32px' }}
                                      />
                                      {feeRows.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeBulkFeeRow(room.roomId, idx)}
                                          className={styles.btnGhost}
                                          aria-label="ลบรายการ"
                                          style={{ color: 'var(--status-unpaid)' }}
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowBulkBillModal(false)}
              >
                ❌ ปิดหน้าต่าง
              </button>

              {(() => {
                const displayRooms = bulkRoomList.filter(r => bulkBuildingFilter === 'ALL' || r.buildingId === bulkBuildingFilter);
                const eligibleCount = displayRooms.filter(r => !r.hasInvoice && r.hasMeter).length;
                return (
                  <button
                    type="button"
                    disabled={bulkGenerating || eligibleCount === 0}
                    onClick={handleBulkGenerate}
                    className={`${styles.btn} ${styles.btnSuccess}`}
                    style={{
                      padding: '0.6rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      boxShadow: 'var(--shadow-glow-success)',
                      opacity: (bulkGenerating || eligibleCount === 0) ? 0.5 : 1,
                      cursor: (bulkGenerating || eligibleCount === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {bulkGenerating
                      ? '⏳ กำลังสร้างใบแจ้งหนี้...'
                      : `🚀 ยืนยันออกบิลทุกห้องพร้อมกัน (${eligibleCount} ห้อง)`}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
