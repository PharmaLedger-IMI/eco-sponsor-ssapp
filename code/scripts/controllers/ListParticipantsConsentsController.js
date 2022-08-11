// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { participantConsentsTableHeaders } from '../constants/participant.js';
const BreadCrumbManager = commonServices.getBreadCrumbManager();
import SitesService from '../services/SitesService.js';
import ParticipantsService from '../services/ParticipantsService.js';

export default class ListParticipantsConsentsController extends BreadCrumbManager {
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
    let { participantUid, trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid } = this.history.location.state;

    this.model = {
      participantUid,
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
      label: `Site Participant's Consents`,
      tag: `site-participants-consents`
    });

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getConsents();
  }

  async getConsents() {
    window.WebCardinal.loader.hidden = false;
    const model = await this.participantsService.getParticipantConsentHistory(
      this.model.participantUid,
      this.model.trialKeySSI,
      this.model.siteKeySSI
    );

    this.model.consents = JSON.parse(JSON.stringify(model));
    const dataModel = model.map((x) => {
      const maxVersion = Math.max.apply(
        Math,
        x.versions.map((o) => parseInt(o.version))
      );
      const maxVersionObj = x.versions.find((z) => z.version === maxVersion);
      return {
        ...x,
        ...maxVersionObj,
        versionToShow: `V${maxVersionObj.version} ${new Date(maxVersionObj.versionDate).toLocaleDateString('en-UK')}`,
      };
    });
    this.model.data = JSON.parse(JSON.stringify(dataModel));
    window.WebCardinal.loader.hidden = true;
  }

  attachEvents() {
    this.model.addExpression(
      'consentsArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.onTagClick('view-participant-consent-history', async (model) => {
      this.navigateToPageTag('site-participants-history', {
        participantUid: this.model.participantUid,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        data: model.versions.map((x) => ({ ...model, ...x })),
        breadcrumb: this.model.toObject('breadcrumb')
      });
    });

    this.onTagClick('view-participant-consent-preview', async (model) => {
      this.navigateToPageTag('site-participant-preview', {
        participantUid: this.model.participantUid,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        consent: model,
        breadcrumb: this.model.toObject('breadcrumb')
      });
    });
  }
}
