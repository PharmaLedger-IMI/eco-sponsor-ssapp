// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { participantTableHeaders } from '../constants/participant.js';
const BreadCrumbManager = commonServices.getBreadCrumbManager();
import SitesService from '../services/SitesService.js';
import ParticipantsService from '../services/ParticipantsService.js';
const Constants = commonServices.Constants;

export default class ListSiteParticipantsController extends BreadCrumbManager {
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = participantTableHeaders;

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
    let { trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid } = this.history.location.state;

    this.model = {
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
      label: `${siteId} / Participants`,
      tag: `site-participants`,
    });

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getParticipants();
  }

  async getParticipants() {
    window.WebCardinal.loader.hidden = false;
    const model = await this.participantsService.getTrialParticipants(this.model.trialKeySSI, this.model.siteKeySSI);
    this.model.participants = JSON.parse(JSON.stringify(model));
    this.model.data = JSON.parse(JSON.stringify(model));
    this.getStatistics();
    window.WebCardinal.loader.hidden = true;
  }

  getStatistics() {
    const participants = JSON.parse(JSON.stringify(this.model.participants));
    const numberOfParticipants = participants && participants.length > 0 && participants.length;
    if (numberOfParticipants) {
      const statistics = {};
      statistics.enrolled = participants.filter((x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.ENROLLED);
      statistics.withdrew = participants.filter((x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.WITHDRAW);
      statistics.declined = participants.filter((x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.DECLINED);
      statistics.screened = participants.filter((x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.SCREENED);
      statistics.planned = participants.filter((x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.PLANNED);
      statistics.endOfTreatment = participants.filter(
        (x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.END_OF_TREATMENT
      );
      statistics.completed = participants.filter((x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.COMPLETED);
      statistics.discontinued = participants.filter(
        (x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.DISCONTINUED
      );
      statistics.screenFailed = participants.filter(
        (x) => x.status === Constants.TRIAL_PARTICIPANT_STATUS.SCREEN_FAILED
      );
      for (const key in statistics) {
        if (Object.hasOwnProperty.call(statistics, key)) {
          statistics[key] = statistics[key].length;
        }
      }
      // TODO: define enrollment percentage. Compared to what? Sum of all patients?
      // Only patients that went through screening? Predefined number of patients needed for the trial?
      statistics.percentageEnrolled = (
        (statistics.enrolled + statistics.completed + statistics.endOfTreatment / numberOfParticipants) *
        100
      ).toFixed(2);
      this.model.statistics = statistics;
    } else {
      this.model.statistics = null;
    }
  }

  attachEvents() {
    this.model.addExpression(
      'participantsArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.onTagClick('view-participant-consents', async (model) => {
      this.navigateToPageTag('site-participants-consents', {
        participantDid: model.did,
        participantUid: model.uid,
        participantPk: model.tpUid,
        participantId: model.number,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        breadcrumb: this.model.toObject('breadcrumb'),
      });
    });

    this.onTagClick('view-participant-status', async (model) => {
      this.navigateToPageTag('site-participant-status', {
        participantDid: model.did,
        participantUid: model.uid,
        participantPk: model.tpUid,
        participantId: model.number,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        breadcrumb: this.model.toObject('breadcrumb'),
      });
    });

    this.onTagClick('view-participant-devices', async (model) => {
      this.navigateToPageTag('site-participant-devices', {
        participantUid: model.uid,
        participantId: model.number,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        breadcrumb: this.model.toObject('breadcrumb'),
      });
    });
  }
}
