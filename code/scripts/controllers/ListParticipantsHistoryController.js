// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const BreadCrumbManager = commonServices.getBreadCrumbManager();
import TrialsService from '../services/TrialsService.js';
import { participantConsentsTableHeaders } from '../constants/participant.js';
import SitesService from '../services/SitesService.js';
import ParticipantsService from '../services/ParticipantsService.js';

export default class ListParticipantsHistoryController extends BreadCrumbManager {
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
    let { participantDid, participantPk, trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid, data } =
      this.history.location.state;

    this.model = {
      participantDid,
      participantPk,
      trialId,
      trialKeySSI,
      trialUid,
      siteKeySSI,
      siteId,
      siteUid,
      site: null,
      consents: [],
      trialConsents: [],
      data: JSON.parse(JSON.stringify(data)),
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'consents',
      tableLength: 7,
      addConsentButtonDisabled: true,
    };

    this.model.breadcrumb = this.setBreadCrumb({
      label: `Consent History`,
      tag: `site-participants-history`,
    });

    this.attachEvents();

    this.init();
  }

  init() {}

  attachEvents() {
    this.model.addExpression(
      'historyArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.onTagClick('view-participant-consent-preview', async (model) => {
      this.navigateToPageTag('site-participant-preview', {
        participantDid: this.model.participantDid,
        participantPk: this.model.participantPk,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        consent: model,
        breadcrumb: this.model.toObject('breadcrumb'),
      });
    });
  }
}
