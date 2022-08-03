// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { siteConsentTableHeaders, consentTypeEnum } from '../constants/consent.js';
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
const { getDidServiceInstance } = commonServices.DidService;
import SitesService from '../services/SitesService.js';
import ConsentService from '../services/ConsentService.js';
const Constants = commonServices.Constants;

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListSiteConsentsController extends WebcController {
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = siteConsentTableHeaders;

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
    this.consentService = new ConsentService(this.DSUStorage);
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
      mandatoryExists: null,
    };

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getConsents();
  }

  async getConsents() {
    window.WebCardinal.loader.hidden = false;
    this.model.trialConsents = await this.consentService.getTrialConsents(this.model.trialKeySSI);
    const site = await this.sitesService.getSite(this.model.siteUid);

    const model = this.getSiteConsents(site);
    this.model.mandatoryExists = !!model.find((x) => x.type === consentTypeEnum.Mandatory);
    this.model.site = site;
    this.model.data = model.map((x) => ({
      ...x,
      siteConsentNameVer: `${x.name}, ver. ${this.getMaxVersionNumber(x)} ${
        this.checkConsentVersion(x) ? 'OUTDATED' : ''
      }`,
      trialConsentNameVer: `${x.trialConsentName}, ver. ${this.getMaxVersionNumber(
        this.model.trialConsents.find((y) => y.id === x.trialConsentId)
      )} ${this.checkConsentVersion(x) ? 'NEW' : ''}`,
    }));
    this.model.consents = model;
    window.WebCardinal.loader.hidden = true;
    this.checkAddConsentButton();
  }

  checkConsentVersion(x) {
    const maxVersion = this.getMaxVersionNumber(this.model.trialConsents.find((y) => y.id === x.trialConsentId));
    return maxVersion !== x.versions[x.versions.length - 1].trialConsentVersion;
  }

  checkAddConsentButton() {
    if (this.model.trialConsents.length === 0) {
      this.model.addConsentButtonDisabled = true;
    } else if (this.model.trialConsents.length > this.model.site.consents.length) {
      this.model.addConsentButtonDisabled = false;
    } else this.model.addConsentButtonDisabled = true;
  }

  getSiteConsents(site) {
    if (!site.consents || site.consents.length === 0) {
      return [];
    } else {
      const result = site.consents.map((x) => ({
        ...x,
        ...x.versions.map((x) => ({ ...x, versionDate: new Date(x.versionDate).toLocaleDateString('en-UK') }))[
          x.versions.length - 1
        ],
        trialConsentVersion: 1,
      }));
      return result;
    }
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
      'consentsArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.onTagClick('add-consent', async (model) => {
      this.showModalFromTemplate(
        'add-new-site-consent',
        async (_event) => {
          await this.getConsents();
          this.checkAddConsentButton();
          this.showInformationModal('Result', 'Consent added successfully', 'toast');
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showInformationModal('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewSiteConsentModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          site: JSON.parse(JSON.stringify(this.model.site)),
          selectedConsent: null,
          siteConsent: null,
          consents: JSON.parse(JSON.stringify(this.model.trialConsents)),
          trialUid: this.model.trialUid,
          mandatoryExists: this.model.mandatoryExists,
        }
      );
    });

    this.onTagClick('add-site-consent', async (model) => {
      const selectedConsent = JSON.parse(
        JSON.stringify(this.model.trialConsents.find((x) => x.id === model.trialConsentId))
      );
      this.showModalFromTemplate(
        'add-new-site-consent',
        async (_event) => {
          // const response = event.detail;
          await this.getConsents();
          this.checkAddConsentButton();
          this.showInformationModal('Result', 'Consent added successfully', 'toast');
          // this.sendMessageToHco(
          //   Constants.MESSAGES.HCO.ADD_CONSENT,
          //   response.sReadSSI,
          //   'Site consent',
          //   selectedSite.did
          // );
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showInformationModal('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewSiteConsentModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          site: JSON.parse(JSON.stringify(this.model.site)),
          selectedConsent,
          siteConsent: model,
          consents: JSON.parse(JSON.stringify(this.model.trialConsents)),
          trialUid: this.model.trialUid,
        }
      );
    });

    this.onTagClick('view-site-consent-history', async (model) => {
      const selectedConsent = this.model.data.find((x) => x.uid === model.uid);
      const data = selectedConsent.versions.map((x) => ({
        ...selectedConsent,
        ...x,
        versionDate: new Date(x.versionDate).toLocaleDateString('en-UK'),
      }));
      this.navigateToPageTag('site-consent-history', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteId: this.model.siteId,
        siteKeySSI: this.model.siteKeySSI,
        siteUid: this.model.siteUid,
        data: JSON.parse(JSON.stringify(data)),
      });
    });

    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('site-preview-consent', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteId: this.model.siteId,
        siteKeySSI: this.model.siteKeySSI,
        siteUid: this.model.siteUid,
        data: model,
        history: null,
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

  getMaxVersionNumber(data) {
    return Math.max.apply(
      Math,
      data.versions.map((o) => parseInt(o.version))
    );
  }
}
