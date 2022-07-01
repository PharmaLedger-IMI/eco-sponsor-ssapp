// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { participantTableHeaders } from '../constants/participant.js';
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
const { getDidServiceInstance } = commonServices.DidService;
import SitesService from '../services/SitesService.js';
import ParticipantsService from '../services/ParticipantsService.js';
const Constants = commonServices.Constants;

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListSiteParticipantsController extends WebcController {
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

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getParticipants();
  }

  async getParticipants() {
    window.WebCardinal.loader.hidden = false;
    const model = await this.participantsService.getTrialParticipants(this.model.trialKeySSI, this.model.siteKeySSI);
    console.log(JSON.parse(JSON.stringify(this.model.trialConsents)));
    const site = await this.sitesService.getSite(this.model.siteUid);

    console.log(JSON.parse(JSON.stringify(site)));
    this.model.participants = JSON.parse(JSON.stringify(model));
    this.model.data = JSON.parse(JSON.stringify(model));
    window.WebCardinal.loader.hidden = true;
  }

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
      'participantsArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.onTagClick('view-participant-status', async (model) => {
      console.log(model);
    });

    this.onTagClick('view-participant-consents', async (model) => {
      console.log(model);
      this.navigateToPageTag('site-participants-consents', {
        participantUid: model.uid,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
      });
    });

    this.onTagClick('view-participant-status', async (model) => {
      console.log(model);
      this.navigateToPageTag('site-participant-status', {
        participantUid: model.uid,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
      });
    });

    this.onTagClick('view-participant-devices', async (model) => {
      console.log(model);
      this.navigateToPageTag('site-participant-devices', {
        participantUid: model.uid,
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
      });
    });

    this.onTagClick('navigate-to-sites', async () => {
      this.navigateToPageTag('sites', {
        id: this.model.trialId,
        keySSI: this.model.trialKeySSI,
        uid: this.model.trialUid,
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
