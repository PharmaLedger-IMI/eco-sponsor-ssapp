// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import { trialStatusesEnum } from '../constants/trial.js';
import { trialStagesEnum } from '../constants/trial.js';
import VisitsService from './VisitsService.js';

export default class TrialsService extends DSUService {
  TRIALS_TABLE = 'trials';

  constructor(DSUStorage) {
    super('/trials');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
    this.visitsService = new VisitsService(DSUStorage);
  }

  async getTrials() {
    const result = await this.storageService.filterAsync(this.TRIALS_TABLE);
    if (result) {
      return result.filter((x) => !x.deleted);
    } else return [];
  }

  async getTrial(uid) {
    const result = await this.getEntityAsync(uid);
    return result;
  }

  async getTrialFromDB(id) {
    return await this.storageService.getRecordAsync(this.TRIALS_TABLE, id);
  }

  async createTrial(data) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    const trial = await this.saveEntityAsync({
      ...data,
      stage: trialStagesEnum.Created,
      status: trialStatusesEnum.Active,
      created: new Date().toISOString(),
    });
    const visits = await this.visitsService.createTrialVisits(trial.keySSI, {});
    await this.addTrialToDB({
      id: trial.id,
      keySSI: trial.keySSI,
      uid: trial.uid,
      sReadSSI: trial.sReadSSI,
      name: trial.name,
      status: trial.status,
      sponsor: trial.sponsor,
      did: trial.did,
      stage: trial.stage,
      created: trial.created,
      visitsKeySSI: visits.keySSI,
      visitsUid: visits.uid,
      visitsSReadSSI: visits.sReadSSI,
      consents: [],
    });

    await this.storageService.commitBatch();

    return trial;
  }

  async addTrialToDB(data) {
    const newRecord = await this.storageService.insertRecordAsync(this.TRIALS_TABLE, data.id, data);
    return newRecord;
  }

  async updateTrialConsents(data, trialUid) {
    const trialDSU = await this.getEntityAsync(trialUid);
    const trial = await this.getTrialFromDB(trialDSU.id);
    const existingConsent = trial.consents && trial.consents.find((x) => x.id === data.id);
    if (existingConsent) {
      existingConsent.versions = data.versions;
      existingConsent.visits = data.visits || [];
    } else {
      trial.consents = [...trial.consents, data];
    }
    await this.storageService.updateRecordAsync(this.TRIALS_TABLE, trial.id, {
      ...trial,
    });

    const updatedTrialDSU = await this.updateEntityAsync({ ...trialDSU, consents: trial.consents });
    return updatedTrialDSU;
  }

  async changeTrialStatus(status, trial) {
    try {
      this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    const trialDb = await this.getTrialFromDB(trial.id);
    const trialDSU = await this.getEntityAsync(trial.uid);

    const updatedTrial = this.storageService.updateRecordAsync(this.TRIALS_TABLE, trial.id, {
      ...trialDb,
      status,
    });
    const updatedDSU = this.updateEntityAsync({ ...trialDSU, status });

    const result = await Promise.allSettled([updatedTrial, updatedDSU]);

    await this.storageService.commitBatch();

    return result[0].status === 'fulfilled' ? result[0].value : null;
  }

  async changeTrialStage(stage, trial) {
    const trialDb = await this.getTrialFromDB(trial.id);
    const trialDSU = await this.getEntityAsync(trial.uid);

    const updatedTrial = this.storageService.updateRecordAsync(this.TRIALS_TABLE, trial.id, {
      ...trialDb,
      stage,
    });
    const updatedDSU = this.updateEntityAsync({ ...trialDSU, stage });

    const result = await Promise.allSettled([updatedTrial, updatedDSU]);

    return result[0].status === 'fulfilled' ? result[0].value : null;
  }

  async updateTrialDetails(trial, trialNewDetails) {
    const trialDb = await this.getTrialFromDB(trial.id);
    const trialDSU = await this.getEntityAsync(trial.uid);

    const updateTrialDB = this.storageService.updateRecordAsync(this.TRIALS_TABLE, trial.id, {
      ...trialDb,
      ...trialNewDetails,
    });
    const updatedTrialDSU = this.updateEntityAsync({ ...trialDSU, ...trialNewDetails });
    return await Promise.allSettled([updateTrialDB, updatedTrialDSU]);
  }
}
