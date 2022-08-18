// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import VisitsService from '../services/VisitsService.js';

const BreadCrumbManager = commonServices.getBreadCrumbManager();

export default class ListVisitsController extends BreadCrumbManager {
    constructor(...props) {
        super(...props);

        const prevState = this.getState();
        this.visitsService = new VisitsService(this.DSUStorage);

        this.model = {...prevState};

        this.model.breadcrumb = this.setBreadCrumb({
            label: `${this.model.consentData.name} / Visits`,
            tag: `visits`
        });

        this.init();
    }

    async init() {
        window.WebCardinal.loader.hidden = false;
        await this.getVisits();
        window.WebCardinal.loader.hidden = true;
    }

    async getVisits() {
        const visitsFilter = {
            trialId: this.model.trialId,
            consentId: this.model.consentData.id,
            consentVersion: this.model.consentData.version
        };
        const visitsAndProcedures = await this.visitsService.getConsentVisits(this.model.trialKeySSI, visitsFilter) || {};
        let visitsData = {}, visitsHeaders = [], hasVisitsAndProcedures = false;
        this.model.visits = {visitsData, visitsHeaders, hasVisitsAndProcedures};

        visitsAndProcedures.visits.forEach(visit => {
            let {id, day, name, visitWindow, week, procedures} = visit;
            visitsHeaders.push({id, day, name, visitWindow, week});

            procedures.forEach(procedure => {
                if (!visitsData[procedure.name]) {
                    visitsData[procedure.name] = {
                        name: procedure.name,
                        scheduleList: []
                    };
                }

                visitsData[procedure.name].scheduleList.push({checked: procedure.checked});
            });
        });

        this.model.visits.visitsHeaders = visitsHeaders;
        this.model.visits.visitsData = Object.keys(visitsData).map(key => {
            return {
                procedureName: key,
                scheduleList: visitsData[key].scheduleList
            };
        });
        this.model.visits.hasVisitsAndProcedures = this.model.visits.visitsData.length > 0;
    }
}
