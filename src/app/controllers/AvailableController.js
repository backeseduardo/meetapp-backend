import { parse, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class AvailableController {
  async index(req, res) {
    const meetups = await Meetup.findAndCountAll({
      where: {
        date: {
          [Op.gte]: new Date(),
          [Op.between]: [
            startOfDay(parse(req.query.date)),
            endOfDay(parse(req.query.date)),
          ],
        },
      },
      order: [['date', 'DESC']],
      limit: 20,
      offset: (req.query.page - 1) * 20,
      attributes: ['id', 'title', 'description', 'location', 'date'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    const subscribedMeetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [
            startOfDay(parse(req.query.date)),
            endOfDay(parse(req.query.date)),
          ],
        },
      },
      attributes: ['id'],
      include: [
        {
          model: User,
          // through: 'users_meetups',
          as: 'participants',
          where: {
            id: req.userId,
          },
          attributes: [],
        },
      ],
    });

    const { rows } = meetups;

    meetups.rows = rows.map(
      ({ id, title, description, location, date, banner, user }) => ({
        id,
        title,
        description,
        location,
        date,
        banner,
        user,
        subscribed: subscribedMeetups.some(s => s.id === id),
      })
    );

    return res.json(meetups);
  }
}

export default new AvailableController();
