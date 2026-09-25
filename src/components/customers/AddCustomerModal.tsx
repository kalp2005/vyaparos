'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { User, Phone, Mail, MapPin, IndianRupee } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Customer phone number is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create customer');
      }

      // Reset Form
      setName('');
      setPhoneNumber('');
      setEmail('');
      setAddress('');
      setOpeningBalance('');
      setNotes('');
      onSuccess(data.customer);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding customer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.modals.addCustomerTitle}
      subtitle={t.modals.addCustomerSub}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <Input
          label={t.modals.customerName}
          placeholder="e.g. Ramesh Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label={t.modals.mobileNumber}
          type="tel"
          placeholder="e.g. 9876543210"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          leftIcon={<Phone className="w-4 h-4" />}
          helperText={t.modals.mobileHelper}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={t.modals.openingBalance}
            type="number"
            step="0.01"
            placeholder="0.00"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            leftIcon={<IndianRupee className="w-4 h-4" />}
            helperText={t.modals.openingBalanceHelper}
          />

          <Input
            label={t.modals.emailOptional}
            type="email"
            placeholder="ramesh@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        <Input
          label={t.modals.addressOptional}
          placeholder="e.g. Shop #4, Main Market, Lucknow"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin className="w-4 h-4" />}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            {t.modals.cancel}
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            {t.modals.saveCustomer}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
