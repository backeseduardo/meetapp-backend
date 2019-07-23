import * as yup from 'yup';
import { isBefore, parse, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const { id } = req.params;

    if (id) {
      const meetup = await Meetup.findOne({
        where: {
          user_id: req.userId,
          id,
        },
        order: [['date', 'DESC']],
        attributes: ['id', 'title', 'description', 'location', 'date'],
        include: [
          {
            model: File,
            as: 'banner',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });

      if (!meetup) {
        return res.status(404).json({ error: 'Meetup not found' });
      }

      return res.json(meetup);
    }

    const meetups = await Meetup.findAndCountAll({
      where: {
        user_id: req.userId,
        ...(req.query.date
          ? {
              date: {
                [Op.between]: [
                  startOfDay(parse(req.query.date)),
                  endOfDay(parse(req.query.date)),
                ],
              },
            }
          : {}),
      },
      order: [['date', 'DESC']],
      ...(req.query.page
        ? {
            limit: 20,
            offset: (req.query.page - 1) * 20,
          }
        : {}),
      attributes: ['id', 'title', 'description', 'location', 'date'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = yup.object().shape({
      title: yup.string().required(),
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

    const {
      id,
      title,
      description,
      location,
      date,
      banner,
    } = await Meetup.create({
      ...req.body,
      user_id: req.userId,
    });

    return res.json({ id, title, description, location, date, banner });
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

    const { id, title, description, location, date } = await meetup.update(
      req.body
    );

    return res.json({ id, title, description, location, date });
  }

  async delete(req, res) {
    const meetup = await Meetup.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        {
          model: File,
          as: 'banner',
        },
      ],
    });

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'Cannot cancel a past meetup' });
    }

    await Promise.all([meetup.banner.destroy(), meetup.destroy()]);

    return res.json();
  }
}

export default new MeetupController();
