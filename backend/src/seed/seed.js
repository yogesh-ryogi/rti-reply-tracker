/**
 * Seed script that recreates the prototype demo data.
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const RTI = require('../models/RTI');
const Scheme = require('../models/Scheme');
const Application = require('../models/Application');
const { DAY_MS } = require('../utils/constants');

const DAYS_AGO = (n) => new Date(Date.now() - n * DAY_MS);
const DAYS_FROM_NOW = (n) => new Date(Date.now() + n * DAY_MS);

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    RTI.deleteMany({}),
    Scheme.deleteMany({}),
    Application.deleteMany({}),
  ]);

  console.log('Creating users...');
  // Citizens
  const ramesh = await User.create({
    email: 'ramesh@test.com',
    password: 'abc123',
    name: 'Ramesh K',
    phone: '90000 00001',
    role: 'citizen',
    joinedAt: DAYS_AGO(120),
  });
  const lakshmi = await User.create({
    email: 'lakshmi@test.com',
    password: 'abc123',
    name: 'Lakshmi S',
    phone: '90000 00002',
    role: 'citizen',
    joinedAt: DAYS_AGO(90),
  });

  // PDOs
  const pdoAlpha = await User.create({
    email: 'pdo.alpha@demo.com',
    password: 'alphapdo123',
    name: 'PDO alpha',
    role: 'pdo',
    panchayat: 'alpha',
  });
  const pdoBeta = await User.create({
    email: 'pdo.beta@demo.com',
    password: 'betapdo123',
    name: 'PDO beta',
    role: 'pdo',
    panchayat: 'beta',
  });
  const pdoGamma = await User.create({
    email: 'pdo.gamma@demo.com',
    password: 'gammapdo123',
    name: 'PDO gamma',
    role: 'pdo',
    panchayat: 'gamma',
  });

  // Clerks
  const clerkAlpha1 = await User.create({
    email: 'clerk.alpha@demo.com',
    password: 'suresh123',
    name: 'Suresh (Clerk)',
    role: 'clerk',
    panchayat: 'alpha',
  });
  const clerkAlpha2 = await User.create({
    email: 'clerk2.alpha@demo.com',
    password: 'meena123',
    name: 'Meena (Clerk)',
    role: 'clerk',
    panchayat: 'alpha',
  });
  const clerkBeta1 = await User.create({
    email: 'clerk.beta@demo.com',
    password: 'kavitha123',
    name: 'Kavitha (Clerk)',
    role: 'clerk',
    panchayat: 'beta',
  });
  const clerkBeta2 = await User.create({
    email: 'clerk2.beta@demo.com',
    password: 'ravi123',
    name: 'Ravi (Clerk)',
    role: 'clerk',
    panchayat: 'beta',
  });
  const clerkGamma1 = await User.create({
    email: 'clerk.gamma@demo.com',
    password: 'prakash123',
    name: 'Prakash (Clerk)',
    role: 'clerk',
    panchayat: 'gamma',
  });
  const clerkGamma2 = await User.create({
    email: 'clerk2.gamma@demo.com',
    password: 'divya123',
    name: 'Divya (Clerk)',
    role: 'clerk',
    panchayat: 'gamma',
  });

  console.log('Creating schemes...');
  const schemesData = [
    {
      displayId: 'S1',
      name: 'Rural Housing Support Scheme',
      level: 'Central',
      issuedAt: DAYS_AGO(3),
      deadline: DAYS_FROM_NOW(25),
      summary: 'Financial help to build a pucca house for rural families that do not have one.',
      benefit: 'Assistance paid in instalments as construction progresses.',
      eligibility: 'Rural families without a pucca house, in the beneficiary survey list.',
      documents: 'Aadhaar, ration card, site or land document, bank passbook.',
      howToApply: 'Submit the form at the gram panchayat office or on the scheme portal.',
    },
    {
      displayId: 'S2',
      name: 'Household Tap Water Connection Subsidy',
      level: 'State',
      issuedAt: DAYS_AGO(5),
      deadline: DAYS_FROM_NOW(9),
      summary: 'Subsidy for rural households to get a piped drinking water connection.',
      benefit: 'Part of the connection cost is paid by the government.',
      eligibility: 'Rural households that do not yet have a piped water connection.',
      documents: 'Aadhaar, ration card, address proof, bank passbook.',
      howToApply: 'Apply through the gram panchayat office or the scheme portal.',
    },
    {
      displayId: 'S3',
      name: 'Farmer Pension Support Scheme',
      level: 'Central',
      issuedAt: DAYS_AGO(10),
      deadline: DAYS_FROM_NOW(40),
      summary: 'Monthly pension support for small and marginal farmers after they reach pension age.',
      benefit: 'A regular monthly pension after the pension age.',
      eligibility: 'Small and marginal farmers who enrol before the last date.',
      documents: 'Aadhaar, land record, bank passbook.',
      howToApply: 'Enrol at the nearest common service centre or gram panchayat office.',
    },
    {
      displayId: 'S4',
      name: 'Girl Child Education Scholarship',
      level: 'State',
      issuedAt: DAYS_AGO(2),
      deadline: DAYS_FROM_NOW(18),
      summary: "Scholarship to help girls from low-income families continue school and college.",
      benefit: "Yearly scholarship amount paid to the student's bank account.",
      eligibility: 'Girl students from families under the income limit in the notification.',
      documents: 'School ID, income certificate, bank passbook, Aadhaar.',
      howToApply: 'Apply online through the school or college, verified by the gram panchayat.',
    },
    {
      displayId: 'S5',
      name: 'Rural Skill Training Programme',
      level: 'Central',
      issuedAt: DAYS_AGO(20),
      deadline: DAYS_FROM_NOW(4),
      summary: 'Free short courses in trades such as tailoring, electrical work and computer basics.',
      benefit: 'Free training and a certificate on completion.',
      eligibility: 'Rural youth within the age range in the notification.',
      documents: 'Aadhaar, education certificate, passport photo.',
      howToApply: 'Register at the district skill centre or through the gram panchayat.',
    },
    {
      displayId: 'S6',
      name: 'Household Solar Light Subsidy',
      level: 'State',
      issuedAt: DAYS_AGO(40),
      deadline: DAYS_AGO(3),
      summary: 'Subsidy for rural households to install solar lights.',
      benefit: 'Part of the cost of a solar light is paid by the government.',
      eligibility: 'Rural households that do not yet have a solar light.',
      documents: 'Aadhaar, ration card, address proof.',
      howToApply: 'Applications are now closed.',
    },
    {
      displayId: 'S7',
      name: 'Self Help Group Interest Subsidy',
      level: 'Central',
      issuedAt: DAYS_AGO(1),
      deadline: DAYS_FROM_NOW(60),
      summary: 'Interest subsidy for women self help groups that take bank loans.',
      benefit: 'Part of the loan interest is paid back to the group.',
      eligibility: 'Registered women self help groups active for at least six months.',
      documents: 'Group registration, bank account details, savings record.',
      howToApply: 'Apply through the bank or the block office.',
    },
  ];
  const schemes = await Scheme.insertMany(schemesData);
  const schemeById = Object.fromEntries(schemes.map((s) => [s.displayId, s]));

  console.log('Creating RTI requests...');
  // Helper matching prototype mk()
  const makeRTI = async (displayId, panchayat, citizen, subject, filedDaysAgo, repliedDaysAgo = null, repliedBy = null, replyText = null) => {
    const filedAt = DAYS_AGO(filedDaysAgo);
    const dueAt = new Date(filedAt.getTime() + 30 * DAY_MS);
    const log = [{ date: filedAt, text: `Submitted by ${citizen.name}` }];
    const doc = {
      displayId,
      panchayat,
      citizen: citizen._id,
      subject,
      filedAt,
      dueAt,
      status: 'open',
      log,
    };
    if (repliedDaysAgo != null) {
      const repliedAt = DAYS_AGO(repliedDaysAgo);
      doc.status = 'replied';
      doc.repliedAt = repliedAt;
      doc.repliedBy = repliedBy._id;
      doc.replyText = replyText;
      log.push({ date: repliedAt, text: `Replied by ${repliedBy.name}` });
    }
    return RTI.create(doc);
  };

  await makeRTI('RTI-001', 'alpha', ramesh, 'MGNREGA muster rolls 2025-26', 27);
  await makeRTI('RTI-002', 'alpha', lakshmi, 'Ration card beneficiary list', 12);
  await makeRTI('RTI-003', 'alpha', ramesh, 'Borewell tender documents', 3);
  await makeRTI('RTI-004', 'beta', ramesh, 'Street light repair expenses', 22);
  await makeRTI('RTI-005', 'beta', lakshmi, 'Village fund audit report', 8);
  await makeRTI('RTI-006', 'gamma', lakshmi, 'Water tank construction bills', 31);
  await makeRTI('RTI-007', 'alpha', ramesh, 'Panchayat meeting minutes', 60, 41, clerkAlpha1, 'Minutes of all meetings sent as PDF.');
  await makeRTI('RTI-008', 'alpha', lakshmi, 'Road repair estimate', 48, 28, clerkAlpha2, 'Estimate and work order copy provided.');
  await makeRTI('RTI-009', 'alpha', ramesh, 'Anganwadi funds report', 40, 15, clerkAlpha1, 'Fund statement attached.');
  await makeRTI('RTI-010', 'alpha', lakshmi, 'Pension list 2025', 35, 29, clerkAlpha2, 'Beneficiary list provided.');
  await makeRTI('RTI-011', 'alpha', ramesh, 'School building grant', 70, 36, clerkAlpha1, 'Grant sanction letter provided.');
  await makeRTI('RTI-012', 'beta', lakshmi, 'Tax collection register', 45, 30, clerkBeta1, 'Register extract provided.');
  await makeRTI('RTI-013', 'beta', ramesh, 'Drainage work order', 33, 10, clerkBeta2, 'Work order copy provided.');
  await makeRTI('RTI-014', 'gamma', ramesh, 'Toilet construction list', 50, 22, clerkGamma1, 'Beneficiary list provided.');
  await makeRTI('RTI-015', 'beta', lakshmi, 'Anganwadi attendance records', 55, 38, clerkBeta1, 'Attendance records provided.');
  await makeRTI('RTI-016', 'beta', ramesh, 'Borewell maintenance bills', 62, 24, clerkBeta2, 'Bills and vouchers provided.');
  await makeRTI('RTI-017', 'beta', lakshmi, 'Housing scheme beneficiaries', 28, 12, clerkBeta1, 'Beneficiary list provided.');
  await makeRTI('RTI-018', 'gamma', lakshmi, 'Community hall construction cost', 44, 20, clerkGamma2, 'Cost statement provided.');
  await makeRTI('RTI-019', 'gamma', ramesh, 'Ration shop inspection report', 38, 31, clerkGamma1, 'Inspection report provided.');
  await makeRTI('RTI-020', 'gamma', lakshmi, 'Road lighting contract', 58, 16, clerkGamma2, 'Contract copy provided.');
  await makeRTI('RTI-021', 'gamma', ramesh, 'Health camp expenses', 30, 18, clerkGamma1, 'Expense statement provided.');

  console.log('Creating scheme applications...');
  // APP-001: Payment requested
  await Application.create({
    displayId: 'APP-001',
    scheme: schemeById.S1._id,
    schemeDisplayId: 'S1',
    citizen: ramesh._id,
    panchayat: 'alpha',
    filedAt: DAYS_AGO(3),
    status: 'Payment requested',
    note: '',
    payment: {
      amount: 500,
      reason: 'Sanction processing fee',
      requestedAt: DAYS_AGO(1),
      dueAt: DAYS_FROM_NOW(6),
      paid: false,
    },
    log: [
      { date: DAYS_AGO(3), text: `Applied by ${ramesh.name}` },
      { date: DAYS_AGO(2), text: `Status changed to Under review by ${clerkAlpha1.name}` },
      {
        date: DAYS_AGO(1),
        text: `Payment of ₹500 requested by ${clerkAlpha1.name} (Sanction processing fee). Pay by ${DAYS_FROM_NOW(6).toLocaleDateString('en-IN')}`,
      },
    ],
  });

  // APP-002: Submitted
  await Application.create({
    displayId: 'APP-002',
    scheme: schemeById.S4._id,
    schemeDisplayId: 'S4',
    citizen: lakshmi._id,
    panchayat: 'alpha',
    filedAt: DAYS_AGO(1),
    status: 'Submitted',
    note: 'For my daughter, class 9.',
    log: [
      {
        date: DAYS_AGO(1),
        text: `Applied by ${lakshmi.name} (note: For my daughter, class 9.)`,
      },
    ],
  });

  // APP-003: Approved
  await Application.create({
    displayId: 'APP-003',
    scheme: schemeById.S3._id,
    schemeDisplayId: 'S3',
    citizen: ramesh._id,
    panchayat: 'beta',
    filedAt: DAYS_AGO(3),
    status: 'Approved',
    note: '',
    reply: 'Sanction order sent to your registered address.',
    sanctionRef: 'SAN-001',
    completedBy: clerkBeta1._id,
    log: [
      { date: DAYS_AGO(3), text: `Applied by ${ramesh.name}` },
      {
        date: DAYS_AGO(1),
        text: `Status changed to Approved by ${clerkBeta1.name}: Documents verified`,
      },
    ],
  });

  // APP-004: Payment received
  await Application.create({
    displayId: 'APP-004',
    scheme: schemeById.S7._id,
    schemeDisplayId: 'S7',
    citizen: lakshmi._id,
    panchayat: 'gamma',
    filedAt: DAYS_AGO(4),
    status: 'Payment received',
    note: '',
    payment: {
      amount: 300,
      reason: 'Application verification fee',
      requestedAt: DAYS_AGO(3),
      dueAt: DAYS_FROM_NOW(4),
      paid: true,
      paidAt: DAYS_AGO(1),
      method: 'UPI',
      txnId: 'TXN-1001',
    },
    log: [
      { date: DAYS_AGO(4), text: `Applied by ${lakshmi.name}` },
      {
        date: DAYS_AGO(3),
        text: `Payment of ₹300 requested by ${clerkGamma1.name} (Application verification fee). Pay by ${DAYS_FROM_NOW(4).toLocaleDateString('en-IN')}`,
      },
      {
        date: DAYS_AGO(1),
        text: `Payment of ₹300 paid by ${lakshmi.name} via UPI (TXN-1001)`,
      },
    ],
  });

  console.log('Seed completed successfully!');
  console.log('\nDemo logins:');
  console.log('  Citizen : ramesh@test.com / abc123');
  console.log('  Citizen : lakshmi@test.com / abc123');
  console.log('  Clerk   : clerk.alpha@demo.com / suresh123  (also clerk2.alpha, beta, gamma)');
  console.log('  PDO     : pdo.alpha@demo.com / alphapdo123  (also beta, gamma)');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
