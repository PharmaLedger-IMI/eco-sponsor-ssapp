// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
import TrialsService from '../services/TrialsService.js';
import { participantConsentsTableHeaders } from '../constants/participant.js';
import SitesService from '../services/SitesService.js';
import ParticipantsService from '../services/ParticipantsService.js';

export default class ListParticipantsStatusController extends BreadCrumbManager {
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = participantConsentsTableHeaders;

  consents = null;

  pagination = {
    previous: false,
    next: false,
    items: null,
    pages: {
      selectOptions: '',
    },
    slicedPages: null,
    currentPage: 0,
    itemsPerPage: 10,
    totalPages: null,
    itemsPerPageOptions: {
      selectOptions: this.itemsPerPageArray.map((x) => ({ value: x, label: x })),
      value: this.itemsPerPageArray[1].value,
    },
  };

  constructor(...props) {
    super(...props);

    this.trialsService = new TrialsService(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);
    this.participantsService = new ParticipantsService(this.DSUStorage);
    let { participantUid, participantPk, participantId, trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid } =
      this.history.location.state;

    this.model = {
      participantUid,
      participantPk,
      participantId,
      trialId,
      trialKeySSI,
      trialUid,
      siteKeySSI,
      siteId,
      siteUid,
      site: null,
      consents: [],
      trialConsents: [],
      data: null,
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'consents',
      tableLength: 7,
      addConsentButtonDisabled: true,
    };

    this.model.breadcrumb = this.setBreadCrumb({
      label: `${participantId} / Site Participant's Status`,
      tag: `site-participant-status`,
    });

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getData();
  }

  async getData() {
    window.WebCardinal.loader.hidden = false;
    const model = await this.participantsService.getParticipantFromDb(
      this.model.participantUid,
      this.model.trialKeySSI,
      this.model.siteKeySSI
    );
    const consents = await this.participantsService.getParticipantConsentHistory(
      this.model.participantUid,
      this.model.trialKeySSI,
      this.model.siteKeySSI
    );

    const consentsSigned = consents.filter((x) => {
      return (
        x.versions.filter((y) => {
          return y.actions.filter((z) => z.name === 'Signed').length > 0;
        }).length > 0
      );
    });

    const rows = consentsSigned
      .map((x) =>
        x.versions
          .filter((y) => {
            return y.actions.filter((z) => z.name === 'Signed').length > 0;
          })
          .map((z) => ({ view: `${z.version} - ${x.trialConsentName}`, consent: { ...x, ...z } }))
      )
      .flat();

    debugger;
    model.consentsSigned = rows.length > 0 ? rows[0].view : '-';
    rows.shift();

    this.model.data = [
      {
        screenedDate: model.screenedDate || '',
        enrolledDate: model.enrolledDate || '',
        endOfTreatmentDate: model.endOfTreatmentDate || '',
        completedDate: model.completedDate || '',
        WDSFDate:
          (model.withdrewDate !== '-' && model.withdrewDate) ||
          (model.discontinuedDate !== '-' && model.discontinuedDate) ||
          (model.screenFailedDate !== '-' && model.screenFailedDate) ||
          '-',
        reconsentRequired: !model.tpSigned,
        consentsSigned: model.consentsSigned,
        consent: rows.length > 0 && rows[0].consent,
      },
      ...rows.map((x) => ({
        screenedDate: '',
        enrolledDate: '',
        endOfTreatmentDate: '',
        completedDate: '',
        WDSFDate: '',
        reconsentRequired: '',
        consentsSigned: x.view,
        consent: x.consent,
      })),
    ];

    window.WebCardinal.loader.hidden = true;
  }

  attachEvents() {
    this.model.addExpression(
      'consentsArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.onTagClick('view-participant-consent-preview', async (model) => {
      this.navigateToPageTag('site-participant-preview', {
        participantPk: this.model.participantPk,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        consent: model.consent,
        breadcrumb: this.model.toObject('breadcrumb'),
      });
    });
  }
}
