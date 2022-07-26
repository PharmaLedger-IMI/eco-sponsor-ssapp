// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { participantConsentsTableHeaders } from '../constants/participant.js';
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
const { getDidServiceInstance } = commonServices.DidService;
import SitesService from '../services/SitesService.js';
import ParticipantsService from '../services/ParticipantsService.js';
const Constants = commonServices.Constants;

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListParticipantsHistoryController extends WebcController {
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
    let { participantUid, trialId, trialKeySSI, trialUid, siteKeySSI, siteId, siteUid, data } =
      this.history.location.state;

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
      data: JSON.parse(JSON.stringify(data)),
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'consents',
      tableLength: 7,
      addConsentButtonDisabled: true,
    };

    this.attachEvents();

    this.init();
  }

  async init() {}

  showInformationModal(title, message, alertType) {
    this.showErrorModal(
      message,
      title,
      () => {},
      () => {},
      {
        disableExpanding: true,
        disableCancelButton: true,
      }
    );
  }

  attachEvents() {
    this.model.addExpression(
      'historyArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.onTagClick('navigate-to-sites', async () => {
      this.navigateToPageTag('sites', {
        id: this.model.trialId,
        keySSI: this.model.trialKeySSI,
        uid: this.model.trialUid,
      });
    });

    this.onTagClick('navigate-to-subjects', async (model) => {
      this.navigateToPageTag('site-participants', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
      });
    });

    this.onTagClick('navigate-to-participant-consents', async (model) => {
      this.navigateToPageTag('site-participants-consents', {
        participantUid: this.model.participantUid,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
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
      });
    });
  }

  sendMessageToHco(operation, ssi, shortMessage, receiverDid) {
    let communicationService = getCommunicationServiceInstance();
    communicationService.sendMessage(receiverDid, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
