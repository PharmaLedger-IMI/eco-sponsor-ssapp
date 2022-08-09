export const siteStatusesEnum = {
  Active: 'Active',
  OnHold: 'On Hold',
  Cancelled: 'Cancelled',
};

export const siteStagesEnum = {
  Created: 'Created',
  Submission: 'Submission',
  Initiated: 'Initiated',
  Recruiting: 'Recruiting',
  Enrolling: 'Enrolling',
  Completed: 'Completed',
};

export const getActivatedSiteStagesEnum = ()=>{
  const {Submission,Initiated} = siteStagesEnum;
  const disabledStatuses =  [Submission,Initiated];
  const activeSiteStagesEnum = {};

  for(let status in siteStagesEnum){
    activeSiteStagesEnum[status] = {
      value:siteStagesEnum[status],
      disabled: disabledStatuses.includes(siteStagesEnum[status])
    }
  }

  return activeSiteStagesEnum;
}

export const siteTableHeaders = [
  {
    column: 'name',
    label: 'Site Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'id',
    label: 'Site Number/ID',
    notSortable: false,
    type: 'number',
    asc: null,
    desc: null,
  },
  {
    column: 'country',
    label: 'Country',
    notSortable: false,
    type: 'string',
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
    column: 'stage',
    label: 'Stage',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'did',
    label: 'Contact Data',
    notSortable: false,
    type: 'number',
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
