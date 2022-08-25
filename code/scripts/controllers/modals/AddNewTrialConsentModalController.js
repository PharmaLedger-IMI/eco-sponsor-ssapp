// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const Constants = commonServices.Constants;
const { getCommunicationServiceInstance } = commonServices.CommunicationService;

import { consentTypeEnum, maxAllowedMandatoryConsents } from '../../constants/consent.js';
import ConsentService from '../../services/ConsentService.js';
import SitesService from '../../services/SitesService.js';
import VisitsService from '../../services/VisitsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialConsentModalController extends WebcController {
  constructor(...props) {
    super(...props);

    this.model = this.getInitialViewModel();
    this.consentsService = new ConsentService(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);
    this.visitsService = new VisitsService(this.DSUStorage);

    this.attachAll();
  }

  attachAll() {
    ['type', 'name', 'version', 'id'].forEach((field) => {
      this.model.onChange(`consent.${field}.value`, this.consentInputHandler.bind(this));
    });
    ['consentDocument', 'visitsAndProceduresDocument'].forEach((field) => {
      this.model.onChange(`consent.${field}.file`, this.consentFileInputHandler.bind(this));
    });
    this.model.onChange('canDisplayVisitAndProceduresUpload', this.validateFormIntegrity.bind(this));

    this.on('add-consent-file', (event) => {
      const files = event.data;
      if (files && files.length > 0) {
        this.model.consent.consentDocument.file = files[0];
        this.model.consent.consentDocument.name = files[0].name;
      } else {
        this.model.consent.consentDocument.file = null;
        this.model.consent.consentDocument.name = '';
      }
    });

    this.on('add-visits-file', (event) => {
      const files = event.data;
      if (files && files.length > 0) {
        this.model.consent.visitsAndProceduresDocument.file = files[0];
        this.model.consent.visitsAndProceduresDocument.name = files[0].name;
      } else {
        this.model.consent.visitsAndProceduresDocument.file = null;
        this.model.consent.visitsAndProceduresDocument.name = '';
      }
    });

    this.onTagClick('create-consent', () => {
      const createUpdateConsent = (err, visitsAndProcedures) => {
        if (this.model.isUpdate) {
          return this.updateConsentHandler(visitsAndProcedures);
        }

        this.createConsentHandler(visitsAndProcedures);
      };

      if (this.model.canDisplayVisitAndProceduresUpload) {
        return this.parseVisitsAndProceduresFile(createUpdateConsent);
      }

      createUpdateConsent();
    });
  }

  consentFileInputHandler() {
    this.validateFormIntegrity();
  }

  consentInputHandler() {
    const { id } = this.model.toObject('consent');
    this.model.consent.id.invalidValue = false;

    if (this.isExistingId(id.value)) {
      this.model.consent.id.invalidValue = true;
      return;
    }

    this.validateFormIntegrity();
  }

  validateFormIntegrity() {
    const { type, name, version, id, consentDocument, visitsAndProceduresDocument } = this.model.toObject('consent');

    const isValidType = type.value && type.value.trim().length > 0;
    const isValidName = name.value && name.value.trim().length > 0;
    const isValidVersion = version.value && !this.isExistingVersion(version.value);
    const isValidId = id.value && id.value.trim().length > 0 && !this.isExistingId(id.value);
    const isValidConsentDoc = consentDocument.file !== null;
    const isValidVisitsDoc = this.model.canDisplayVisitAndProceduresUpload
      ? visitsAndProceduresDocument.file !== null
      : true;

    this.model.submitButtonDisabled =
      !isValidName || !isValidType || !isValidId || !isValidVersion || !isValidConsentDoc || !isValidVisitsDoc;
  }

  isExistingId(id) {
    this.model.consent.id.invalidValue = !!(this.model.existingIds && this.model.existingIds.indexOf(id) > -1);
    return this.model.consent.id.invalidValue;
  }

  isExistingVersion(version) {
    this.model.consent.version.invalidValue = !!(
      this.model.existingVersions && this.model.existingVersions.indexOf(version) > -1
    );
    return this.model.consent.version.invalidValue;
  }

  parseVisitsAndProceduresFile(callback) {
    Papa.parse(this.model.consent.visitsAndProceduresDocument.file, {
      complete: async (results, file) => {
        if (results.data && results.data.length > 0) {
          const dataArray = results.data;
          const visitNamesIdx = dataArray.findIndex((x) => x[0] === 'Visit');
          if (visitNamesIdx && visitNamesIdx >= 0) {
            const length = dataArray[visitNamesIdx].length;

            const titles = dataArray[visitNamesIdx - 1].filter((x) => x !== '');
            const visits = dataArray[visitNamesIdx].slice(1, length);
            const week = dataArray[visitNamesIdx + 1].slice(1, length);
            const day = dataArray[visitNamesIdx + 2].slice(1, length);
            const visitWindow = dataArray[visitNamesIdx + 3].slice(1, length);

            let procedures = dataArray.slice(visitNamesIdx + 4, dataArray.length);

            procedures = procedures.filter((x) => x[0] && x[0] !== '' && x[0] !== ' ');

            const result = visits.map((visit, idx) => {
              const uuid = uuidv4();
              return {
                id: idx,
                uuid,
                name: visit,
                week: parseInt(week[idx]),
                day: parseInt(day[idx]),
                titles,
                visitWindow:
                  visitWindow[idx] !== 'X'
                    ? {
                        windowFrom: parseInt(visitWindow[idx].split('/')[0]),
                        windowTo: parseInt(visitWindow[idx].split('/')[1]),
                      }
                    : null,
                procedures: procedures.map((procedure, procedureIdx) => ({
                  name: procedure[0],
                  uuid: uuidv4(),
                  checked: procedure[idx + 1] === 'X',
                  id: procedureIdx,
                })),
              };
            });

            callback(undefined, result);
          }
        }
      },
    });
  }

  async createConsentHandler(visitsAndProcedures) {
    window.WebCardinal.loader.hidden = false;
    const consent = {
      name: this.model.consent.name.value,
      type: this.model.consent.type.value,
      id: this.model.consent.id.value,
      versions: [
        {
          version: this.model.consent.version.value,
          versionDate: new Date().toISOString(),
          file: this.model.consent.consentDocument.file,
        },
      ],
    };
    const result = await this.consentsService.createTrialConsent(consent, this.model.trialId);
    const visitsResult = await this.visitsService.updateConsentVisits(
      this.model.trialSSI,
      this.model.trialId,
      consent.id,
      this.model.consent.version.value,
      visitsAndProcedures
    );
    this.sendMessageToAllTrialSites(this.model.trialSSI);
    window.WebCardinal.loader.hidden = true;
    this.send('confirmed', result);
  }

  async updateConsentHandler(visitsAndProcedures) {
    const existingVersions = this.model.existingVersions.map((o) => parseInt(o));
    const selectedValue = parseInt(this.model.consent.version.value);
    const smallerThan = selectedValue < Math.max.apply(Math, existingVersions);
    if (smallerThan) {
      Object.assign(this.model.consent.version, { invalidValue: true });
      setTimeout(() => {
        Object.assign(this.model.consent.version, { invalidValue: null });
      }, 1000);

      window.WebCardinal.loader.hidden = true;
      return;
    }

    const version = {
      version: this.model.consent.version.value,
      versionDate: new Date().toISOString(),
      file: this.model.consent.consentDocument.file,
    };

    const result = await this.consentsService.updateTrialConsent(version, this.model.trialId, this.model.isUpdate);
    const visitsResult = await this.visitsService.updateConsentVisits(
      this.model.trialSSI,
      this.model.trialId,
      this.model.isUpdate.id,
      this.model.consent.version.value,
      visitsAndProcedures
    );
    this.sendMessageToAllTrialSites(this.model.trialSSI);
    this.model.submitButtonDisabled = false;
    window.WebCardinal.loader.hidden = true;
    this.send('confirmed', result);
  }

  async sendMessageToAllTrialSites(trialSSI) {
    const sites = await this.sitesService.getSites(trialSSI);
    for (const site of sites) {
      await this.sendMessageToHco(
        Constants.MESSAGES.HCO.UPDATE_BASE_PROCEDURES,
        trialSSI,
        'New visits and procedures',
        site.did
      );
    }
  }

  async sendMessageToHco(operation, ssi, shortMessage, receiverDid) {
    try {
      let communicationService = getCommunicationServiceInstance();
      await communicationService.sendMessage(receiverDid, {
        operation: operation,
        ssi: ssi,
        shortDescription: shortMessage,
      });
    } catch (err) {
      console.error(err);
    }
  }

  getInitialViewModel() {
    let typesArray = Object.entries(consentTypeEnum).map(([_k, v]) => ({ value: v, label: v }));
    if (!this.model.isUpdate && this.model.numberOfMandatoryConsents >= maxAllowedMandatoryConsents) {
      typesArray = typesArray.filter((x) => x.value !== consentTypeEnum.Mandatory);
    } else if (!this.model.isUpdate && this.model.numberOfMandatoryConsents === 0) {
      typesArray = typesArray.filter((x) => x.value !== consentTypeEnum.Optional);
    }
    const trialId = this.getState().id;
    const trialSSI = this.getState().keySSI;
    let selectedVersion = 1;

    if (this.model.isUpdate) {
      selectedVersion =
        Math.max.apply(
          Math,
          this.model.existingVersions.map((o) => parseInt(o))
        ) + 1;
    }

    const initialViewModel = {
      trialId,
      trialSSI,
      submitButtonDisabled: true,
      canDisplayVisitAndProceduresUpload: this.model.isUpdate === false,
      consent: {
        type: {
          label: 'Select type',
          placeholder: 'Please select an option',
          required: true,
          selectOptions: typesArray,
          value: typesArray[0].value,
        },
        name: {
          label: 'Name',
          name: 'name',
          required: true,
          placeholder: 'Please insert a name...',
          value: '',
        },
        version: {
          label: 'Version',
          name: 'version',
          required: true,
          placeholder: 'Please insert version number...',
          value: selectedVersion,
          disabled: true,
        },
        id: {
          label: 'Consent Number/ID',
          name: 'id',
          required: true,
          placeholder: 'Please insert an Id...',
          value: '',
        },
        consentDocument: {
          displayLabel: 'Select Consent file',
          label: 'Select file',
          required: true,
          listFiles: true,
          filesAppend: false,
          file: null,
          name: '',
        },
        visitsAndProceduresDocument: {
          displayLabel: 'Select Visits and Procedures file',
          label: 'Select file',
          required: true,
          listFiles: true,
          filesAppend: false,
          file: null,
          name: '',
        },
      },
    };

    if (this.model.isUpdate) {
      initialViewModel.consent.id = {
        ...initialViewModel.consent.id,
        value: this.model.isUpdate.id,
        disabled: true,
      };
      initialViewModel.consent.name = {
        ...initialViewModel.consent.name,
        value: this.model.isUpdate.name,
        disabled: true,
      };
      initialViewModel.consent.type = {
        ...initialViewModel.consent.type,
        value: this.model.isUpdate.type,
        disabled: true,
      };
    }

    return initialViewModel;
  }
}
