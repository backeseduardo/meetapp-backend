import * as yup from 'yup';
import { isBefore, parse } from 'date-fns';
import { promisify } from 'util';
import { resolve } from 'path';
import { unlink } from 'fs';

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

    const { id, description, location, date, banner } = await Meetup.create({
      ...req.body,
      user_id: req.userId,
      banner: req.file.filename,
    });

    return res.json({ id, description, location, date, banner });
  }

  async update(req, res) {
    const meetup = await Meetup.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });

    if (!meetup) {
      /**
       * TODO: Find a more efficient way to not save the file when there's some error
       */
      await promisify(unlink)(req.file.path);
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (isBefore(meetup.date, new Date())) {
      await promisify(unlink)(req.file.path);
      return res.status(400).json({ error: 'This meetup already happened' });
    }

    if (req.file) {
      const bannerPath = `${resolve(
        __dirname,
        '..',
        '..',
        '..',
        'tmp',
        'uploads'
      )}/${meetup.banner}`;

      await promisify(unlink)(bannerPath);
    }

    const { id, description, location, date, banner } = await meetup.update({
      ...req.body,
      banner: req.file ? req.file.filename : null,
    });

    return res.json({ id, description, location, date, banner });
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
