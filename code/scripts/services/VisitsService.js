// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;

export default class VisitsService extends DSUService {
  VISITS_TABLE = 'visits';

  constructor(DSUStorage) {
    super('/visits');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
  }

  async getConsentVisits(trialSSI, filterObj) {
    const result = (await this.storageService.getRecordAsync(this.VISITS_TABLE, trialSSI)) || {};

    if (!filterObj) {
      return result;
    }

    const visits = result.visits;
    const filteredVisits = visits.filter((visit) => {
      let isGoodValue = true;
      Object.keys(filterObj).forEach((key) => {
        if (visit[key] !== filterObj[key]) {
          isGoodValue = false;
        }
      });

      return isGoodValue;
    });

    if (filteredVisits.length === 1) {
      return filteredVisits[0];
    }

    return filteredVisits;
  }

  async createConsentVisits(trialSSI, visitsAndProcedures = []) {
    const visits = await this.saveEntityAsync({
      visits: visitsAndProcedures,
    });
    await this.addVisitsToDB(trialSSI, {
      keySSI: visits.keySSI,
      uid: visits.uid,
      sReadSSI: visits.sReadSSI,
      visits: visitsAndProcedures,
    });

    return visits;
  }

  async updateConsentVisits(trialSSI, trialId, consentId, consentVersion, visitsAndProcedures) {
    const visitsDb = await this.getConsentVisits(trialSSI);
    const visitsDSU = await this.getEntityAsync(visitsDb.uid);

    if (!visitsAndProcedures) {
      // Available only on add trial consent version
      // If no new visits are provided, the previous visits are also applied for this version of consent
      const previousVisits = visitsDb.visits.find((visit) => {
        return (
          visit.trialId === visit.trialId &&
          visit.consentId === consentId &&
          visit.consentVersion === consentVersion - 1
        );
      });

      visitsDb.visits.push({ trialId, consentId, consentVersion, visits: [...previousVisits.visits] });
    } else {
      const existingVisitInDBIndex = visitsDb.visits.findIndex((visit) => {
        return (
          visit.trialId === visit.trialId && visit.consentId === consentId && visit.consentVersion === consentVersion
        );
      });

      if (existingVisitInDBIndex === -1) {
        visitsDb.visits.push({
          trialId,
          consentId,
          consentVersion,
          visits: visitsAndProcedures,
          updatedAtConsentVersion: consentVersion,
        });
      } else {
        visitsDb.visits[existingVisitInDBIndex] = {
          trialId,
          consentId,
          consentVersion,
          visits: visitsAndProcedures,
          updatedAtConsentVersion: consentVersion,
        };
      }
    }

    const updatedVisitsDSU = this.updateEntityAsync({ ...visitsDSU, visits: visitsDb.visits });
    const updatedVisitsDB = this.storageService.updateRecordAsync(this.VISITS_TABLE, trialSSI, {
      ...visitsDb,
    });

    const result = await Promise.allSettled([updatedVisitsDSU, updatedVisitsDB]);
    return result[0].status === 'fulfilled' ? result[0].value : null;
  }

  async addVisitsToDB(trialSSI, data) {
    const newRecord = await this.storageService.insertRecordAsync(this.VISITS_TABLE, trialSSI, data);
    return newRecord;
  }

  async getVisitsFromDB(trialSSI) {
    const visits = await this.storageService.getRecordAsync(this.VISITS_TABLE, trialSSI);
    return visits;
  }
}
