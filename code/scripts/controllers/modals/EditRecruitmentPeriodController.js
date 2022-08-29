const commonServices = require('common-services');
const { Constants, momentService } = commonServices;

const { WebcController } = WebCardinal.controllers;

export default class EditRecruitmentPeriodController extends WebcController {
  constructor(...props) {
    super(...props);
    this.model = {
      ...this.getInitModel(props[0]),
    };

    this.model.disabled = true;
    this.initHandlers();
  }

  initHandlers() {
    this.attachHandlerSubmit();

    let recruitmentPeriodHandler = () => {
      this.model.disabled = false;
      let startDate = this.model.startDate.value;
      let endDate = this.model.endDate.value;

      let fromDateObj = new Date(startDate);
      let toDateObj = new Date(endDate);

      if (startDate) {
        this.model.endDate.min = momentService(startDate).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern);
      }
      if (endDate) {
        this.model.startDate.max = momentService(endDate).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern);
      }
      if (
        !this.model.startDate.value ||
        !this.model.endDate.value ||
        fromDateObj > toDateObj ||
        !(toDateObj instanceof Date)
      ) {
        this.model.disabled = true;
      }
    };

    this.model.onChange('startDate.value', recruitmentPeriodHandler);
    this.model.onChange('endDate.value', recruitmentPeriodHandler);
  }

  attachHandlerSubmit() {
    this.onTagEvent('tp:submit', 'click', (model, target, event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.send('confirmed', { startDate: this.model.startDate.value, endDate: this.model.endDate.value });
    });
  }

  getInitModel(prevProps) {
    let startDateValue = '',
      endDateValue = '';
    if (prevProps.recruitmentPeriod && prevProps.recruitmentPeriod !== '-') {
      const dates = prevProps.recruitmentPeriod.split('-');
      startDateValue = momentService(dates[0]).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern);
      endDateValue = momentService(dates[1]).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern);
    }

    return {
      startDate: {
        label: 'Start date',
        name: 'startDate',
        required: true,
        placeholder: 'Please set the start date ',
        min: momentService(new Date()).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern),
        value: startDateValue,
      },
      endDate: {
        label: 'End date',
        name: 'endDate',
        required: true,
        min: momentService(new Date()).format(Constants.DATE_UTILS.FORMATS.YearMonthDayPattern),
        placeholder: 'Please set the end recruitment date ',
        value: endDateValue,
      },
    };
  }
}
