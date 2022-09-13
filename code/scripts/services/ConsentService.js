const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import SitesService from './SitesService.js';
import TrialsService from './TrialsService.js';

export default class ConsentService extends DSUService {
  CONSENTS_TABLE = 'consents';
  SITES_PATH = '/sites';
  TRIALS_PATH = '/trials';

  constructor(DSUStorage) {
    super('/consents');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
    this.siteService = new SitesService(DSUStorage);
    this.trialsService = new TrialsService(DSUStorage);
    this.DSUStorage = DSUStorage;
  }

  async getTrialConsents(trialKeySSI) {
    let result = null;
    try {
      result = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, trialKeySSI);
    } catch (e) {
      result = undefined;
    }

    if (result && result.consents) {
      return result.consents.filter((x) => !x.deleted);
    } else return [];
  }

  async addSiteConsent(model, trialKeySSI, siteDSU) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.error(e);
    }
    const site = await this.siteService.getSiteFromDB(siteDSU.did, trialKeySSI);
    const path = this.getConsentPath(site.uid);
    const consent = await this.saveEntityAsync(model, path);
    const attachment = await this.uploadFile(
      `${path}${consent.uid}/versions/${model.versions[0].version.toString()}/${model.versions[0].file.name}`,
      model.versions[0].file
    );
    consent.versions[0].attachment = model.versions[0].file.name;
    const { keySSI, sReadSSI, ...restData } = consent;

    const updatedConsent = await this.updateEntityAsync(restData, path);

    const updatedConsentDB = this.addConsentToDB(
      {
        keySSI: consent.keySSI,
        uid: consent.uid,
        sReadSSI: consent.sReadSSI,
        name: model.name,
        type: model.type,
        trialConsentId: model.trialConsentId,
        trialConsentName: model.trialConsentName,
        versions: [
          {
            trialConsentVersion: model.trialConsentVersion,
            version: model.versions[0].version,
            versionDate: model.versions[0].versionDate,
            attachment: model.versions[0].file.name,
          },
        ],
      },
      site.keySSI
    );
    const updatedSiteConsents = this.siteService.updateSiteConsents(updatedConsent, site.did, trialKeySSI);

    const result = await Promise.allSettled([updatedConsentDB, updatedSiteConsents]);

    await this.storageService.commitBatch();

    return consent;
  }

  async addSiteConsentVersion(model, trialKeySSI, siteDSU) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.error(e);
    }

    const site = await this.siteService.getSiteFromDB(siteDSU.did, trialKeySSI);
    const selectedSiteConsent = site.consents.find((x) => x.trialConsentId === model.trialConsentId);
    const path = this.getConsentPath(site.uid);
    const consentDSU = await this.getEntityAsync(selectedSiteConsent.uid, path);
    const attachment = await this.uploadFile(
      `${path}${consentDSU.uid}/versions/${model.versions[0].version.toString()}/${model.file.name}`,
      model.file
    );
    model.versions[0].attachment = model.file.name;
    consentDSU.versions.push(model.versions[0]);
    consentDSU.trialConsentVersion = model.trialConsentVersion;
    const updatedConsent = await this.updateEntityAsync(consentDSU, path);

    const updatedConsentDB = this.updateConsentToDB(updatedConsent, site.keySSI);
    const updatedSiteConsent = this.siteService.updateSiteConsents(updatedConsent, site.did, trialKeySSI);

    const result = await Promise.allSettled([updatedConsentDB, updatedSiteConsent]);

    await this.storageService.commitBatch();

    return updatedConsent;
  }

  async addConsentToDB(data, keySSI) {
    let record = null;
    try {
      record = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, keySSI);
    } catch (e) {
      record = undefined;
    }

    if (!record) {
      const newRecord = await this.storageService.insertRecordAsync(this.CONSENTS_TABLE, keySSI, { consents: [data] });
      return newRecord;
    } else {
      const updatedRecord = await this.storageService.updateRecordAsync(this.CONSENTS_TABLE, keySSI, {
        ...record,
        consents: [...record.consents, data],
      });

      return updatedRecord;
    }
  }

  async updateConsentToDB(data, keySSI) {
    const record = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, keySSI);

    let consentIdx = record.consents.findIndex((x) => {
      return x.id === data.id;
    });

    record.consents[consentIdx] = data;

    const updatedRecord = await this.storageService.updateRecordAsync(this.CONSENTS_TABLE, keySSI, record);

    return updatedRecord;
  }

  getConsentPath(siteUid) {
    return `${this.SITES_PATH}/${siteUid}/consent/`;
  }

  async createTrialConsent(data, trialId) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.error(e);
    }
    const trial = await this.trialsService.getTrialFromDB(trialId);
    const path = this.getTrialConsentPath(trial.uid);
    const consent = await this.saveEntityAsync(data, path);
    const attachment = await this.uploadFile(
      `${path}${consent.uid}/versions/${data.versions[0].version}/${data.versions[0].file.name}`,
      data.versions[0].file
    );
    consent.versions[0].attachment = data.versions[0].file.name;
    const { keySSI, sReadSSI, ...restData } = consent;
    const updatedConsent = await this.updateEntityAsync(restData, path);

    const updatedConsentDB = this.addConsentToDB(
      {
        id: data.id,
        keySSI: consent.keySSI,
        uid: consent.uid,
        sReadSSI: consent.sReadSSI,
        name: data.name,
        type: data.type,
        versions: [
          {
            version: data.versions[0].version,
            versionDate: data.versions[0].versionDate,
            attachment: data.versions[0].file.name,
          },
        ]
      },
      trial.keySSI
    );

    const updatedTrialConsent = this.trialsService.updateTrialConsents(updatedConsent, trial.uid);

    const result = await Promise.allSettled([updatedConsentDB, updatedTrialConsent]);

    await this.storageService.commitBatch();

    return consent;
  }

  async updateTrialConsent(data, trialId, consent) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.error(e);
    }

    const trial = await this.trialsService.getTrialFromDB(trialId);
    const path = this.getTrialConsentPath(trial.uid);
    const consentDSU = await this.getEntityAsync(consent.uid, path);
    const attachment = await this.uploadFile(
      `${path}${consentDSU.uid}/versions/${data.version}/${data.file.name}`,
      data.file
    );
    data.attachment = data.file.name;
    consentDSU.versions.push(data);
    const updatedConsent = await this.updateEntityAsync(consentDSU, path);

    const updatedConsentDb = this.updateConsentToDB(updatedConsent, trial.keySSI);
    const updatedTrialConsent = this.trialsService.updateTrialConsents(updatedConsent, trial.uid);

    const result = await Promise.allSettled([updatedConsentDb, updatedTrialConsent]);

    await this.storageService.commitBatch();

    return updatedConsent;
  }

  getTrialConsentPath(trialUid) {
    return `${this.TRIALS_PATH}/${trialUid}/consent/`;
  }

  uploadFile(path, file) {
    let getFileContentAsBuffer = (file, callback) => {
      let fileReader = new FileReader();
      fileReader.onload = function (evt) {
        let arrayBuffer = fileReader.result;
        callback(undefined, arrayBuffer);
      };

      fileReader.readAsArrayBuffer(file);
    };

    return new Promise((resolve, reject) => {
      getFileContentAsBuffer(file, (err, arrayBuffer) => {
        if (err) {
          reject('Could not get file as a Buffer');
        }
        this.letDSUStorageInit().then(() => {
          this.DSUStorage.writeFile(path, $$.Buffer.from(arrayBuffer), undefined, (err, keySSI) => {
            if (err) {
              reject(new Error(err));
              return;
            }
            resolve();
          });
        });
      });
    });
  }
}
