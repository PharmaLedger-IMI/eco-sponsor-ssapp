export const participantConsentStatusEnum = {
  Consent: 'Consent',
  WaitingReConsent: 'Waiting re-consent',
  Withdrew: 'Withdrew',
};

export const participantTableHeaders = [
  {
    column: 'participantId',
    label: 'Participant Id',
    notSortable: false,
    type: 'number',
    asc: null,
    desc: null,
  },
  {
    column: 'status',
    label: 'Status',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'enrolledDate',
    label: 'Enrolled Date',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: null,
    label: 'Options',
    notSortable: true,
    desc: null,
  },
];

export const participantConsentsTableHeaders = [
  {
    column: 'name',
    label: 'Consent Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'type',
    label: 'Type',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'version',
    label: 'Version',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'participantSigned',
    label: 'TS Signed',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'participantWithDrew',
    label: 'TS Withdrew',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'hcoSigned',
    label: 'HCO Signature',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: null,
    label: 'Options',
    notSortable: true,
    desc: null,
  },
];

export const senderType = {
  HCP: 'hcp',
  Patient: 'patient',
};
