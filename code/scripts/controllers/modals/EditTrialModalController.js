import TrialsService from '../../services/TrialsService.js';
const { WebcController } = WebCardinal.controllers;

export default class EditTrialModalController extends WebcController {
  name = {
    label: 'Trial name',
    name: 'name',
    required: true,
    placeholder: 'Please insert a name...',
    value: '',
  };

  id = {
    label: 'Trial Number/ID',
    name: 'id',
    required: true,
    placeholder: 'Please insert the trial name/id',
    value: '',
  };

  constructor(...props) {
    super(...props);

    this.trial = props[0].trial;
    this.existingIds = props[0].existingIds;
    this.trialsService = new TrialsService(this.DSUStorage);

    this.model = {
      trial: {
        name: { ...this.name, value: this.trial.name },
        id: { ...this.id, value: this.trial.id },
      },
    };

    this.attachAll();
  }

  attachAll() {
    this.onTagClick('update-trial', async () => {
      try {
        window.WebCardinal.loader.hidden = false;
        let valid = true;
        if (!this.model.trial.name.value || this.model.trial.name.value === '') {
          this.model.trial.name = {
            ...this.model.trial.name,
            invalidValue: true,
          };
          setTimeout(() => {
            this.model.trial.name = {
              ...this.model.trial.name,
              invalidValue: null,
            };
          }, 1000);
          valid = false;
        }

        if (
          !this.model.trial.id.value ||
          this.model.trial.id.value === '' ||
          (this.existingIds.indexOf(this.model.trial.id.value) > -1 && this.model.trial.id.value !== this.trial.id)
        ) {
          this.model.trial.id = {
            ...this.model.trial.id,
            invalidValue: true,
          };
          setTimeout(() => {
            this.model.trial.id = {
              ...this.model.trial.id,
              invalidValue: null,
            };
          }, 1000);
          valid = false;
        }

        if (!valid) {
          window.WebCardinal.loader.hidden = true;
          return;
        }

        const result = await this.trialsService.updateTrialDetails(this.trial, {
          name: this.model.trial.name.value,
          id: this.model.trial.id.value,
        });
        window.WebCardinal.loader.hidden = true;
        this.send('confirmed', result);
      } catch (error) {
        window.WebCardinal.loader.hidden = true;
        this.send('closed', new Error('There was an updating the trial'));
        console.error(error);
      }
    });
  }
}
