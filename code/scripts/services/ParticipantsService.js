import { participantConsentStatusEnum, senderType } from '../constants/participant.js';
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import TrialsService from '../services/TrialsService.js';
import SitesService from '../services/SitesService.js';
const ConsentStatusMapper = commonServices.ConsentStatusMapper;

export default class ParticipantsService extends DSUService {
  PARTICIPANTS_TABLE = 'participants';
  PARTICIPANTS_PATH = '/participants';
  PARTICIPANTS_CONSENTS_PATH = '/participants-consents';
  PARTICIPANTS_CONSENTS_TABLE = 'participants-consents';
  PARTICIPANTS_PK_UID_TABLE = 'participants-pk-uid-table';

  constructor(DSUStorage) {
    super('/participants');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
    this.trialsService = new TrialsService(DSUStorage);
    this.sitesService = new SitesService(DSUStorage);
  }

  async getTrialParticipants(trialKeySSI, siteKeySSI) {
    try {
      let result = null;
      try {
        result = await this.storageService.filterAsync(this.getTableName(trialKeySSI, siteKeySSI));
      } catch (e) {
        result = undefined;
      }

      if (result && result.length > 0) {
        return result.filter((x) => !x.deleted);
      } else return [];
    } catch (error) {
      console.error(error.message);
    }
  }

  async getParticipantConsentHistory(participantUid, trialKeySSI, siteKeySSI) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.error(e);
    }

    const participant = await this.getParticipantFromDb(participantUid, trialKeySSI, siteKeySSI);
    const consents = await this.getParticipantConsents(trialKeySSI, siteKeySSI, participant.tpUid);

    const result = consents.map((x) => ({
      ...x,
      versions: x.versions.map((y) => {
        const hcoSignedAction =
          y.actions &&
          y.actions.find((q) => q.type === 'hco' && q.name === ConsentStatusMapper.consentStatuses.signed.name);
        const participantSignedAction =
          y.actions &&
          y.actions.find((q) => q.type === 'tp' && q.name === ConsentStatusMapper.consentStatuses.signed.name);
        const participantWithdrewAction =
          y.actions &&
          y.actions.find((q) => q.type === 'tp' && q.name === ConsentStatusMapper.consentStatuses.withdraw.name);
        return {
          ...y,
          hcoSigned: (hcoSignedAction && hcoSignedAction.toShowDate) || '-',
          participantSigned: (participantSignedAction && participantSignedAction.toShowDate) || '-',
          participantWithDrew: (participantWithdrewAction && participantWithdrewAction.toShowDate) || '-',
        };
      }),
    }));

    await this.storageService.commitBatch();

    return result;
  }

  async addParticipant(ssi, siteDid, tpUid, consentsKeySSIs) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    try {
      const participantDSU = await this.mountEntityAsync(ssi);

      const participantConsentsDb = await this.createParticipantConsents(
        participantDSU.uid,
        tpUid,
        siteDid,
        consentsKeySSIs
      );

      const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);
      const newParticipant = await this.storageService.insertRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.uid,
        { ...participantDSU, tpUid, consents: participantConsentsDb.map((x) => x.uid) }
      );
      const newParticipantPkUid = await this.storageService.insertRecordAsync(this.PARTICIPANTS_PK_UID_TABLE, tpUid, {
        uid: participantDSU.uid,
      });
      await this.storageService.commitBatch();

      return newParticipant;
    } catch (error) {
      console.log(error.message);
    }
  }

  async createParticipantConsents(participantUid, tpUid, siteDid, consentsKeySSIs) {
    const participantDSU = await this.getParticipant(participantUid);
    const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
    const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);

    const participantConsentsPromises = consentsKeySSIs.map((x) => {
      return this.mountEntityAsync(x, this.PARTICIPANTS_CONSENTS_PATH + '/' + tpUid);
    });
    const participantConsents = await Promise.all([...participantConsentsPromises]);

    const participantConsentsDbPromises = participantConsents.map((x) => {
      return this.storageService.insertRecordAsync(this.getConsentTableName(trial.keySSI, site.keySSI), x.uid, x);
    });
    const participantConsentsDb = await Promise.all([...participantConsentsDbPromises]);

    return participantConsentsDb;
  }

  async updateParticipantConsent(pk, siteDid, consentSSIs) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    try {
      const { uid } = await this.storageService.getRecordAsync(this.PARTICIPANTS_PK_UID_TABLE, pk);
      const participantDSU = await this.getParticipant(uid);
      const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);
      const participantDb = await this.getParticipantFromDb(uid, trial.keySSI, site.keySSI);

      const incomingParticipantConsentsPromises = consentSSIs.map((x) => {
        return this.mountEntityAsync(x, this.PARTICIPANTS_CONSENTS_PATH + '/' + participantDb.tpUid);
      });
      const incomingParticipantConsents = await Promise.all([...incomingParticipantConsentsPromises]);

      const existingConsentsPromises = [];
      const newConsentsPromises = [];
      for (const x of incomingParticipantConsents) {
        if (participantDb.consents.indexOf(x.uid) > -1) {
          existingConsentsPromises.push(
            this.storageService.updateRecordAsync(this.getConsentTableName(trial.keySSI, site.keySSI), x.uid, x)
          );
        } else {
          newConsentsPromises.push(
            this.storageService.insertRecordAsync(this.getConsentTableName(trial.keySSI, site.keySSI), x.uid, x)
          );
        }
      }

      const existingConsents = await Promise.all([...existingConsentsPromises]);
      const newConsents = await Promise.all([...newConsentsPromises]);

      // const participantConsentsDbPromises = participantConsents.map((x) => {
      //   return this.storageService.updateRecordAsync(this.getConsentTableName(trial.keySSI, site.keySSI), x.uid, x);
      // });
      // const participantConsentsDb = await Promise.all([...participantConsentsDbPromises]);

      const updatedParticipant = await this.storageService.updateRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.uid,
        {
          ...participantDSU,
          tpUid: participantDb.tpUid,
          consents: [...participantDb.consents, ...newConsents.map((x) => x.uid)],
        }
      );

      await this.storageService.commitBatch();
      return updatedParticipant;
    } catch (error) {
      console.log(error.message);
    }
  }

  async addParticipantNumber(participantUid, siteDid) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    try {
      const participantDSU = await this.getParticipant(participantUid);
      const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);
      const participantDb = await this.getParticipantFromDb(participantUid, trial.keySSI, site.keySSI);

      const updatedParticipant = await this.storageService.updateRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.uid,
        { ...participantDSU, tpUid: participantDb.tpUid, consents: participantDb.consents }
      );

      await this.storageService.commitBatch();
      return updatedParticipant;
    } catch (error) {
      console.log(error.message);
    }
  }

  async mountParticipantConsent(consentSSI, participant) {
    const consent = await this.mountEntityAsync(consentSSI, this.getConsentPath(participant));
    return consent;
  }

  async getParticipant(uid) {
    const result = await this.getEntityAsync(uid);
    return result;
  }

  async getParticipantFromDb(uid, trialKeySSI, siteKeySSI) {
    const result = await this.storageService.getRecordAsync(this.getTableName(trialKeySSI, siteKeySSI), uid);
    return result;
  }

  async getParticipantConsents(trialKeySSI, siteKeySSI, tpUid) {
    const result = await this.storageService.filterAsync(
      this.getConsentTableName(trialKeySSI, siteKeySSI),
      `tpUid == ${tpUid}`
    );
    return result;
  }

  async getParticipantConsentFromDb(consentUid, trialKeySSI, siteKeySSI) {
    let result = null;
    try {
      result = await this.storageService.getRecordAsync(this.getConsentTableName(trialKeySSI, siteKeySSI), consentUid);
    } catch (err) {}
    return result;
  }

  getTableName(trialKeySSI, siteKeySSI) {
    return this.PARTICIPANTS_TABLE + '_' + trialKeySSI + '_' + siteKeySSI;
  }

  getConsentPath() {
    return this.PARTICIPANTS_CONSENTS_PATH;
  }

  getConsentTableName(trialKeySSI, siteKeySSI) {
    return this.PARTICIPANTS_CONSENTS_TABLE + '_' + trialKeySSI + '_' + siteKeySSI;
  }
}
