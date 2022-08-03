export const consentTypeEnum = {
  Mandatory: 'Mandatory',
  Optional: 'Optional',
};

export const consentTableHeaders = [
  {
    column: 'name',
    label: 'Consent Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'attachment',
    label: 'Attachment',
    notSortable: false,
    desc: null,
  },
  {
    column: 'versionDate',
    label: 'Date',
    notSortable: false,
    desc: null,
  },
  {
    column: 'type',
    label: 'Type',
    notSortable: false,
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
    column: null,
    label: 'Options',
    notSortable: true,
    desc: null,
  },
];


export const siteConsentHistoryTableHeaders = [
  {
    column: 'siteConsentNameVer',
    label: 'Site Cons. Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'correspondingMainConsent',
    label: 'Corresponding Main Cons.',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'versionDate',
    label: 'Date',
    notSortable: false,
    desc: null,
  },
  {
    column: 'type',
    label: 'Type',
    notSortable: false,
    desc: null,
  },
  {
    column: null,
    label: 'Options',
    notSortable: true,
    desc: null,
  }
]

export const siteConsentTableHeaders = [
  {
    column: 'siteConsentNameVer',
    label: 'Site Cons. Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'ongoingMainConsent',
    label: 'Ongoing Main Cons.',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'versionDate',
    label: 'Date',
    notSortable: false,
    desc: null,
  },
  {
    column: 'type',
    label: 'Type',
    notSortable: false,
    desc: null,
  },
  {
    column: null,
    label: 'Options',
    notSortable: true,
    desc: null,
  }
];
