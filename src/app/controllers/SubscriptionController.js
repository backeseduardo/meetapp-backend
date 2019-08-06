import { Op } from 'sequelize';
import { isBefore, isSameHour } from 'date-fns';

import User from '../models/User';
import Meetup from '../models/Meetup';
import File from '../models/File';
import Queue from '../../lib/Queue';
import MeetupSubscriptionMail from '../jobs/MeetupSubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.gte]: new Date(),
        },
      },
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
      order: [['date', 'asc']],
    });

    return res.json(meetups);
  }

  async update(req, res) {
    const user = await User.findOne({
      where: { id: req.userId },
      include: [
        {
          model: Meetup,
          through: { attributes: [] },
          as: 'subscriptions',
          attributes: ['id', 'description', 'date'],
        },
      ],
    });

    const meetup = await Meetup.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,
          through: {
            attributes: [],
          },
          as: 'participants',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id === req.userId) {
      return res.status(400).json({
        error: 'You cannot subscribe to a meetup that you have created',
      });
    }

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'This meetup already happened' });
    }

    if (user.subscriptions.some(m => m.id === meetup.id)) {
      return res
        .status(400)
        .json({ error: 'You already have subscribed to this meetup' });
    }

    if (user.subscriptions.some(m => isSameHour(m.date, meetup.date))) {
      return res
        .status(400)
        .json({ error: 'You have a meetup at the same time' });
    }

    await user.addSubscription(meetup.id);

    await Queue.add(MeetupSubscriptionMail.key, {
      user,
      meetup,
    });

    return res.json();
  }

  async delete(req, res) {
    const user = await User.findOne({
      where: { id: req.userId },
      include: [
        {
          model: Meetup,
          through: { attributes: [] },
          as: 'subscriptions',
          attributes: ['id', 'description', 'date'],
        },
      ],
    });

    await user.removeSubscription(req.params.id);

    return res.json();
  }
}

export default new SubscriptionController();
