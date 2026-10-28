"use client";

import { useState } from "react";
import { MessageSquare, ExternalLink, Phone, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WhatsAppReminderProps {
  tenantName: string;
  phoneNumber?: string | null;
  unitLabel?: string;
  propertyName?: string;
  rentAmount?: string | number;
  dueDate?: string;
  balanceDue?: string | number;
  currency?: string;
  customMessage?: string;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  buttonSize?: "default" | "sm" | "icon";
  compact?: boolean;
}

/** Sanitizes phone numbers for WhatsApp api: digits only, international prefix */
export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  // If local format starting with 0, convert to Kenyan (+254) default if 10 digits
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "254" + digits.slice(1);
  }
  return digits;
}

export function buildWhatsAppReminderText({
  tenantName,
  unitLabel,
  propertyName,
  rentAmount,
  dueDate,
  balanceDue,
  currency = "KES",
}: {
  tenantName: string;
  unitLabel?: string;
  propertyName?: string;
  rentAmount?: string | number;
  dueDate?: string;
  balanceDue?: string | number;
  currency?: string;
}): string {
  const firstName = tenantName.trim().split(" ")[0] || tenantName;
  const unitStr = unitLabel ? `Apt ${unitLabel}` : "your rental unit";
  const propStr = propertyName ? ` at ${propertyName}` : "";
  const amtStr = rentAmount ? ` of ${currency} ${Number(rentAmount).toLocaleString()}` : "";
  const dueStr = dueDate ? ` is due on ${dueDate}` : " is now due";
  const balanceStr = balanceDue ? `\n\nOutstanding Balance: ${currency} ${Number(balanceDue).toLocaleString()}` : "";

  return `Hi ${firstName}, just a reminder that rent for ${unitStr}${propStr}${amtStr}${dueStr}.${balanceStr}\n\nPlease let us know once paid or share the payment confirmation. Thank you!`;
}

export function WhatsAppReminderButton({
  tenantName,
  phoneNumber,
  unitLabel = "",
  propertyName = "",
  rentAmount,
  dueDate,
  balanceDue,
  currency = "KES",
  customMessage,
  buttonText = "Send Rent Reminder via WhatsApp",
  buttonVariant = "default",
  buttonSize = "sm",
  compact = false,
}: WhatsAppReminderProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(phoneNumber ?? "");
  const [copied, setCopied] = useState(false);

  const defaultMsg =
    customMessage ||
    buildWhatsAppReminderText({
      tenantName,
      unitLabel,
      propertyName,
      rentAmount,
      dueDate,
      balanceDue,
      currency,
    });

  const [message, setMessage] = useState(defaultMsg);

  const cleanPhone = formatWhatsAppPhone(phone);
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  const handleDirectSend = (e: React.MouseEvent) => {
    // If phone number is available, directly jump to WhatsApp immediately
    if (cleanPhone) {
      e.preventDefault();
      e.stopPropagation();
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      // If phone is missing, open modal to let user enter phone or copy message
      setOpen(true);
    }
  };

  const handleModalSend = () => {
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleDirectSend}
        className={
          buttonVariant === "default"
            ? "bg-[#25D366] text-white hover:bg-[#20ba5a] border-none shadow-sm font-medium gap-1.5 cursor-pointer"
            : "gap-1.5 cursor-pointer text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
        }
        title={`Send Rent Reminder via WhatsApp to ${tenantName}${phoneNumber ? ` (${phoneNumber})` : ""}`}
      >
        <MessageSquare className="size-3.5 fill-current shrink-0" />
        {!compact && <span>{buttonText}</span>}
      </Button>

      {/* Preview & Customization Dialog if requested or if phone number needed */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4 text-[#25D366]" />
              Send WhatsApp Reminder
            </DialogTitle>
            <DialogDescription>
              Review the pre-filled reminder message for <strong>{tenantName}</strong> ({unitLabel || "Unit"}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone" className="text-xs font-medium">
                Tenant WhatsApp Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="wa-phone"
                  placeholder="e.g. +254 712 345 678 or 254712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                International format with country code (e.g. 254... for Kenya, 49... for Germany).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wa-msg" className="text-xs font-medium">
                Pre-filled Message Text
              </Label>
              <textarea
                id="wa-msg"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="size-3.5 mr-1 text-emerald-600" /> : null}
              {copied ? "Copied" : "Copy Text"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleModalSend}
                className="bg-[#25D366] text-white hover:bg-[#20ba5a] border-none font-semibold gap-1.5"
              >
                <Send className="size-3.5" />
                Open WhatsApp
                <ExternalLink className="size-3 opacity-70" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
