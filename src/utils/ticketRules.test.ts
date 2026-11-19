import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFaultTicket,
  classifyFaultPriority,
  validateVoucherCode,
  LINE_SPEED_PACKAGES,
  formatZARPhone,
  maskPublicPhone,
  maskPublicId,
  getTicketProgressPercentage,
  getNextTicketStatus,
  TICKET_TRANSITION_STEPS,
} from './ticketRules.ts';

test('validates full fault report ticket correctly with valid data', () => {
  const result = validateFaultTicket({
    phoneNumbers: '0821234567',
    accountNumber: 'VXK-9021',
    faultDetails: 'Router has continuous red LOS light and zero internet',
    lineSpeed: '10/5Mbps @R900pm',
    idNumber: '9204125028081',
  });
  assert.equal(result.isValid, true);
  assert.equal(Object.keys(result.errors).length, 0);
});

test('catches missing required fields in fault report ticket', () => {
  const result = validateFaultTicket({
    phoneNumbers: '',
    accountNumber: '',
    faultDetails: '',
    lineSpeed: '_none',
    idNumber: '',
  });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.phoneNumbers);
  assert.ok(result.errors.accountNumber);
  assert.ok(result.errors.faultDetails);
  assert.ok(result.errors.lineSpeed);
  assert.ok(result.errors.idNumber);
});

test('validates line speed packages list has exact 5 VXK offerings', () => {
  assert.equal(LINE_SPEED_PACKAGES.length, 5);
  const values = LINE_SPEED_PACKAGES.map((p) => p.value);
  assert.ok(values.includes('6/3Mbps @R350pm'));
  assert.ok(values.includes('8/4Mbps @R600pm'));
  assert.ok(values.includes('10/5Mbps @R900pm'));
  assert.ok(values.includes('12/6Mbps @R1050pm'));
  assert.ok(values.includes('20/10Mbps PUBLIC HOT SPOT WiFi @R1050pm'));
});

test('classifies ticket priority intelligently based on fault symptoms', () => {
  assert.equal(
    classifyFaultPriority('Our fiber cable was cut outside the premises'),
    'Critical'
  );
  assert.equal(classifyFaultPriority('LOS blinking red light on modem'), 'High');
  assert.equal(classifyFaultPriority('Internet feels slow during video calls'), 'Medium');
  assert.equal(classifyFaultPriority('Need general inquiry on account renewal'), 'Low');
});

test('validates voucher code formatting', () => {
  const valid = validateVoucherCode('VXK-9812-4412');
  assert.equal(valid.isValid, true);
  assert.equal(valid.normalized, 'VXK98124412');

  const invalid = validateVoucherCode('123');
  assert.equal(invalid.isValid, false);
});

test('formats South African telephone numbers cleanly', () => {
  assert.equal(formatZARPhone('0821234567'), '082 123 4567');
  assert.equal(formatZARPhone('0115559876'), '011 555 9876');
});

test('masks phone and RSA ID numbers in public view', () => {
  assert.equal(maskPublicPhone('0824559102'), '082 *** 9102');
  assert.equal(maskPublicId('8906155234089'), '8906*******89');
});

test('calculates correct progress percentages across ticket lifecycle', () => {
  assert.equal(getTicketProgressPercentage('Open'), 25);
  assert.equal(getTicketProgressPercentage('Investigating'), 50);
  assert.equal(getTicketProgressPercentage('Technician Dispatched'), 75);
  assert.equal(getTicketProgressPercentage('Resolved'), 100);
});

test('advances ticket sequentially from Pending/Open to Resolved', () => {
  assert.equal(getNextTicketStatus('Open'), 'Investigating');
  assert.equal(getNextTicketStatus('Investigating'), 'Technician Dispatched');
  assert.equal(getNextTicketStatus('Technician Dispatched'), 'Resolved');
  assert.equal(getNextTicketStatus('Resolved'), null);
});

