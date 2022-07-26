import ConsentService from '../services/ConsentService.js';
import VisitsService from '../services/VisitsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialConsentModalController extends WebcController {
  consentsTemplate = {
    label: 'Select consent',
    placeholder: 'Please select a consent',
    required: true,
    selectOptions: [],
    disabled: false,
    invalidValue: false,
  };

  attachment = {
    label: 'Select file',
    listFiles: false,
    filesAppend: false,
    files: [],
    name: '',
    invalidValue: false,
  };

  file = null;

  constructor(...props) {
    super(...props);

    this.consents = props[0].consents || null;

    let { id, keySSI, uid } = this.history.location.state;

    this.id = id;
    this.keySSI = keySSI;
    this.uid = uid;

    this.consentsService = new ConsentService(this.DSUStorage);
    this.visitsService = new VisitsService(this.DSUStorage);

    this.model = {
      consents: {
        ...this.consentsTemplate,
        value: this.consents[0].id,
        selectOptions: this.consents.map((x) => ({ value: x.id, label: x.name })),
      },
      visits: { attachment: this.attachment },
    };

    this.attachAll();
  }

  attachAll() {
    this.on('add-file', (event) => {
      if (event.data) {
        this.file = event.data[0];
        this.model.visits.attachment.name = this.file.name;
      }
    });

    this.model.addExpression(
      'consentsArrayNotEmpty',
      () =>
        !!(
          this.model.consents.selectOptions &&
          Array.isArray(this.model.consents.selectOptions) &&
          this.model.consents.selectOptions.length > 0
        ),
      'consents.selectOptions'
    );

    this.onTagClick('create-visits', async () => {
      try {
        if (!this.file || this.file.length === 0) {
          Object.assign(this.model.visits.attachment, { invalidValue: true });
          setTimeout(() => {
            Object.assign(this.model.visits.attachment, { invalidValue: null });
          }, 2000);
          return;
        }
        if (!this.model.consents.value || this.model.consents.value === '') {
          Object.assign(this.model.consents, { invalidValue: true });
          setTimeout(() => {
            Object.assign(this.model.consents, { invalidValue: null });
          }, 2000);
          return;
        }

        window.WebCardinal.loader.hidden = false;
        Papa.parse(this.file, {
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
                      checked: procedure[idx + 1] === 'X' ? true : false,
                      id: procedureIdx,
                    })),
                  };
                });

                if (this.model.consents.value && this.model.consents.value !== '') {
                  const outcome = await this.visitsService.updateTrialVisits(
                    this.keySSI,
                    result,
                    this.model.consents.value
                  );
                  window.WebCardinal.loader.hidden = true;
                  this.send('confirmed', outcome);
                } else {
                  throw new Error('No consent is selected');
                }
              }
            }
          },
        });

        // setTimeout(() => {
        //   this.model.consent[x] = {
        //     ...this.model.consent[x],
        //     invalidValue: null,
        //   };
        // });
      } catch (error) {
        window.WebCardinal.loader.hidden = true;
        this.send('closed', new Error('There was an issue creating the visits'));
        console.log(error);
      }
    });
  }
}
