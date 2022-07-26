import { participantConsentStatusEnum, senderType } from '../constants/participant.js';
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import TrialsService from '../services/TrialsService.js';
import SitesService from '../services/SitesService.js';

export default class ParticipantsService extends DSUService {
  PARTICIPANTS_TABLE = 'participants';
  PARTICIPANTS_PATH = '/participants';
  PARTICIPANTS_CONSENTS_PATH = '/participants-consents';
  PARTICIPANTS_CONSENTS_TABLE = 'participants-consents';
  PARTICIPANT_LIST_FILENAME = 'participants.json';

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
      console.log(error.message);
    }
  }

  async getParticipantConsentHistory(participantUid, trialKeySSI, siteKeySSI) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    const participantPromise = this.getParticipantFromDb(participantUid, trialKeySSI, siteKeySSI);
    const consentsPromise = this.getParticipantConsents(trialKeySSI, siteKeySSI);
    const sitePromise = this.sitesService.getSiteFromKeySSI(siteKeySSI, trialKeySSI);

    const allPromiseResults = await Promise.allSettled([participantPromise, consentsPromise, sitePromise]);

    const participant = allPromiseResults[0].status === 'fulfilled' ? allPromiseResults[0].value : null;
    const consents = allPromiseResults[1].status === 'fulfilled' ? allPromiseResults[0].value : null;
    const site = allPromiseResults[2].status === 'fulfilled' ? allPromiseResults[0].value : null;

    const result = consents.map((x) => ({
      ...x,
      versions: x.versions.map((z) => ({ ...z, actions: z.actions.filter((y) => y.tpDid === participant.did) })),
    }));

    let siteConsents = site.consents;

    siteConsents = siteConsents.map((x) => ({
      ...x,
      versions: x.versions.map((y) => {
        const participantConsent = result.find((z) => z.name === x.name);
        if (participantConsent) {
          const participantConsentVersion = participantConsent.versions.find((z) => z.version === y.version);
          if (participantConsentVersion) {
            const hcoSignedAction = participantConsentVersion.actions.find(
              (q) => q.type === 'hco' && q.name === 'sign'
            );
            const participantSignedAction = participantConsentVersion.actions.find(
              (q) => q.type === 'tp' && q.name === 'sign'
            );
            const participantWithdrewAction = participantConsentVersion.actions.find(
              (q) => q.type === 'tp' && q.name === 'withdraw-intention'
            );
            return {
              ...y,
              hcoSigned: (hcoSignedAction && hcoSignedAction.toShowDate) || '-',
              participantSigned: (participantSignedAction && participantSignedAction.toShowDate) || '-',
              participantWithDrew: (participantWithdrewAction && participantWithdrewAction.toShowDate) || '-',
            };
          } else return { ...y, actions: [] };
        } else return { ...y, actions: [] };
      }),
    }));

    await this.storageService.commitBatch();

    return siteConsents;
  }

  async updateParticipant(data, ssi, siteDid) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    try {
      const trialUid = data.trialSSI;
      const tpDid = data.tpDid;
      const trialDSU = await this.trialsService.getTrial(trialUid);
      const trial = await this.trialsService.getTrialFromDB(trialDSU.id);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);
      const participantDSU = await this.mountEntityAsync(ssi);
      console.log(trial);
      console.log(site);
      console.log(participantDSU);
      // let list = await this.getTrialParticipants(trialKeySSI);
      // let participantExists = await this.storageService.filterAsync(
      //   this.getTableName(trialKeySSI),
      //   `participantId == ${data.participantId}`
      // );
      // if (participantExists && participantExists.length === 1) {
      //   let participant = participantExists[0];
      //   participant = {
      //     ...participant,
      //     consentName: consent.name,
      //     consentVersion: data.version,
      //     consentStatus: participantConsentStatusEnum.Consent,
      //     patientSignature: data.type === senderType.Patient ? data.action.date : participant.patientSignature,
      //     doctorSignature: data.type === senderType.HCP ? data.action.date : participant.doctorSignature,
      //     // doctorSignature: data.type === senderType.HCP ? data.operationDate : participant.doctorSignature,
      //   };
      //   await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), data.participantId, participant);
      // } else {
      //   const model = {
      //     participantId: data.participantId,
      //     consentName: consent.name,
      //     consentVersion: data.version,
      //     consentStatus: participantConsentStatusEnum.Consent,
      //     patientSignature: data.type === senderType.Patient ? data.action.date : null,
      //     doctorSignature: data.type === senderType.HCP ? data.action.date : null,
      //     // doctorSignature: data.type === senderType.HCP ? data.operationDate : null,
      //   };
      //   await this.storageService.insertRecordAsync(this.getTableName(trialKeySSI), data.participantId, model);
      // }
      // list = await this.getTrialParticipants(trialKeySSI);
      // return list;

      await this.storageService.commitBatch();
    } catch (error) {
      console.log(error.message);
    }
  }

  async addParticipant(ssi, siteDid) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    try {
      const participantDSU = await this.mountEntityAsync(ssi);
      const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);
      const newParticipant = await this.storageService.insertRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.uid,
        participantDSU
      );
      await this.storageService.commitBatch();

      return newParticipant;
    } catch (error) {
      console.log(error.message);
    }
  }

  async updateParticipantConsent(participantUid, siteDid, consentSSI) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    try {
      const participantDSU = await this.getParticipant(participantUid);
      const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);

      if (consentSSI) {
        const consentDSU = await this.mountParticipantConsent(consentSSI, participantDSU);

        let consent = await this.getParticipantConsentFromDb(consentDSU.uid, trial.keySSI, site.keySSI);
        let consentDb = null;
        if (consent) {
          consentDb = await this.storageService.updateRecordAsync(
            this.getConsentTableName(trial.keySSI, site.keySSI),
            consentDSU.uid,
            consentDSU
          );
        } else {
          consentDb = await this.storageService.insertRecordAsync(
            this.getConsentTableName(trial.keySSI, site.keySSI),
            consentDSU.uid,
            consentDSU
          );
        }
      }

      const updatedParticipant = await this.storageService.updateRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.uid,
        participantDSU
      );

      await this.storageService.commitBatch();
      return updatedParticipant;
    } catch (error) {
      console.log(error.message);
    }
  }

  async hcoSignConsent(participantUid, siteDid, consentUid) {
    try {
      await this.storageService.beginBatchAsync();
    } catch (e) {
      console.log(e);
    }

    try {
      const participantDSU = await this.getParticipant(participantUid);
      const consentDSU = await this.getEntityAsync(consentUid, this.getConsentPath(participantDSU));
      const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);

      let consent = await this.getParticipantConsentFromDb(consentDSU.uid, trial.keySSI, site.keySSI);
      let consentDb = null;
      if (consent) {
        consentDb = await this.storageService.updateRecordAsync(
          this.getConsentTableName(trial.keySSI, site.keySSI),
          consentDSU.uid,
          consentDSU
        );
      } else {
        consentDb = await this.storageService.insertRecordAsync(
          this.getConsentTableName(trial.keySSI, site.keySSI),
          consentDSU.uid,
          consentDSU
        );
      }

      const updatedParticipant = await this.storageService.updateRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.uid,
        participantDSU
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

      const updatedParticipant = await this.storageService.updateRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.uid,
        participantDSU
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

  async getParticipantConsents(trialKeySSI, siteKeySSI) {
    const result = await this.storageService.filterAsync(this.getConsentTableName(trialKeySSI, siteKeySSI));
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
