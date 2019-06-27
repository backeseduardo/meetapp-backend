import * as yup from 'yup';
import { isBefore, parse } from 'date-fns';

import Meetup from '../models/Meetup';

class MeetupController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: [['date', 'DESC']],
      limit: 20,
      offset: (req.query.page - 1) * 20,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = yup.object().shape({
      description: yup.string().required(),
      location: yup.string().required(),
      date: yup.date().required(),
    });

    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation fail', errors: err.errors });
    }

    if (isBefore(parse(req.body.date), new Date())) {
      return res
        .status(400)
        .json({ error: "It's not possible to create events with a past date" });
    }

    const { id, description, location, date } = await Meetup.create({
      ...req.body,
      user_id: req.userId,
    });

    return res.json({ id, description, location, date });
  }

  async update(req, res) {
    const meetup = await Meetup.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'This meetup already happened' });
    }

    const { id, description, location, date } = await meetup.update(req.body);

    return res.json({ id, description, location, date });
  }

  async delete(req, res) {
    const meetup = await Meetup.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'Cannot cancel a past meetup' });
    }

    await meetup.destroy();

    return res.json();
  }
}

export default new MeetupController();
