import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class MeetupSubscriptionMail {
  get key() {
    return 'MeetupSubscriptionMail';
  }

  async handle({ data }) {
    const { user, meetup } = data;

    await Mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'New user subscribed to your meetup',
      template: 'meetupSubscription',
      context: {
        meetupCreator: meetup.user.name,
        user: user.name,
        meetup: meetup.description,
        where: meetup.location,
        when: format(meetup.date, 'DD/MM/YYYY HH:mm', {
          locale: pt,
        }),
      },
    });
  }
}

export default new MeetupSubscriptionMail();
